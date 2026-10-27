using System.Net;
using System.Net.Http.Json;
using Electronic_Health_Record.Server.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Tests.Stations;

/// <summary>
/// Each station's submit moves the form to the next desk, and the whole visit
/// runs end to end on the tokens the API itself hands back.
/// </summary>
public class StationHandoffTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    [Fact]
    public async Task Station1_registers_a_new_patient_and_parks_the_form_at_station_2()
    {
        var admin = await _world.AddAdminAsync();
        var client = await _world.ClientForAsync(admin);
        var employeeID = $"EMP-{Guid.NewGuid():N}"[..20];

        var response = await client.PostAsJsonAsync("/api/wellnessforms/station1",
            StationRequests.Station1(employeeID, username: $"m{Guid.NewGuid():N}"[..12]));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var form = await response.JsonAsync();
        Assert.Equal("PendingAssessment", form.GetProperty("status").GetString());
        Assert.Equal(2, form.GetProperty("currentStation").GetInt32());
        Assert.True(form.GetProperty("accountProvisioned").GetBoolean());
        Assert.NotEmpty(form.GetProperty("rowVersion").GetString()!);

        var stored = await _world.FindFormAsync(form.GetProperty("formID").GetInt32());
        Assert.Equal(admin.AdminID, stored!.Station1AdminID);

        // The account the admin hands over starts on the default password and
        // must be replaced at first sign-in.
        var account = await _world.WithDbAsync(db => db.PatientAccounts.SingleAsync(a => a.PatientID == stored.PatientID));
        Assert.True(account.MustChangePassword);
    }

    [Fact]
    public async Task Station1_needs_a_username_to_register_a_patient_for_the_first_time()
    {
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());

        var response = await client.PostAsJsonAsync("/api/wellnessforms/station1",
            StationRequests.Station1($"EMP-{Guid.NewGuid():N}"[..20], username: null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("Username is required", await response.ErrorTextAsync());
    }

    [Fact]
    public async Task Station1_refuses_a_second_visit_while_one_is_still_open()
    {
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());
        var employeeID = $"EMP-{Guid.NewGuid():N}"[..20];
        var first = await client.PostAsJsonAsync("/api/wellnessforms/station1",
            StationRequests.Station1(employeeID, username: $"m{Guid.NewGuid():N}"[..12]));
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/wellnessforms/station1",
            StationRequests.Station1(employeeID, username: null));

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        Assert.Contains("already has a visit in progress", await second.ErrorTextAsync());
    }

    [Fact]
    public async Task Station2_hands_the_form_to_consultation()
    {
        var admin = await _world.AddAdminAsync();
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingAssessment", currentStation: 2);
        var (questionID, optionID, _) = await _world.AddAssessmentQuestionAsync();
        var client = await _world.ClientForAsync(admin);

        var response = await client.SubmitAsync(form.FormID, 2,
            StationRequests.Station2(TestWorld.TokenOf(form), (questionID, optionID)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.JsonAsync();
        Assert.Equal("PendingConsultation", body.GetProperty("status").GetString());
        Assert.Equal(3, body.GetProperty("currentStation").GetInt32());

        var answers = await _world.WithDbAsync(db => db.AssessmentAnswers.Where(a => a.FormID == form.FormID).ToListAsync());
        Assert.Equal(optionID, Assert.Single(answers).OptionID);
    }

    [Fact]
    public async Task Station2_rejects_an_option_that_belongs_to_another_question()
    {
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingAssessment", currentStation: 2);
        var (questionID, _, foreignOptionID) = await _world.AddAssessmentQuestionAsync();
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());

        var response = await client.SubmitAsync(form.FormID, 2,
            StationRequests.Station2(TestWorld.TokenOf(form), (questionID, foreignOptionID)));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("PendingAssessment", (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Fact]
    public async Task Station3_signs_against_the_doctor_picked_on_the_form_not_the_caller()
    {
        // An admin overseeing Station 3 records the consultation for the doctor
        // who gave it.
        var picked = await _world.AddPhysicianAsync(station: 3, surname: "Picked");
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingConsultation", currentStation: 3);
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());

        var response = await client.SubmitAsync(form.FormID, 3,
            StationRequests.Station3(picked.PhysicianID, TestWorld.TokenOf(form)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.JsonAsync();
        Assert.Equal("PendingDental", body.GetProperty("status").GetString());
        Assert.Equal(4, body.GetProperty("currentStation").GetInt32());
        Assert.Equal(picked.PhysicianID, body.GetProperty("physicianID").GetInt32());

        // Frozen onto the record so it stays attributable if the account goes.
        var stored = await _world.FindFormAsync(form.FormID);
        Assert.Equal("Dr. Ana Picked", stored!.SignedByName);
        Assert.Equal(picked.PRCLicenseNo, stored.SignedByLicenseNo);
        Assert.Equal(TestWorld.Signature, stored.Signature);
        Assert.NotNull(stored.SignedAt);
    }

    [Fact]
    public async Task Station4_records_the_dental_assessment_and_hands_the_form_to_vision()
    {
        var dentist = await _world.AddPhysicianAsync(station: 4, surname: "Dentist");
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingDental", currentStation: 4);
        var client = await _world.ClientForAsync(dentist);

        var response = await client.SubmitAsync(form.FormID, 4,
            StationRequests.Station4(dentist.PhysicianID, TestWorld.TokenOf(form)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.JsonAsync();
        Assert.Equal("PendingVision", body.GetProperty("status").GetString());
        Assert.Equal(5, body.GetProperty("currentStation").GetInt32());

        var stored = await _world.FindFormAsync(form.FormID);
        Assert.Equal(dentist.PhysicianID, stored!.DentistID);
        Assert.Equal("Dr. Ana Dentist", stored.DentalSignedByName);
        var dental = await _world.WithDbAsync(db => db.DentalAssessments.SingleAsync(d => d.FormID == form.FormID));
        Assert.Equal("Plaque on lower incisors", dental.OralHygieneStatusRemarks);
    }

    [Fact]
    public async Task Station5_records_the_vision_assessment_and_completes_the_form()
    {
        var optometrist = await _world.AddPhysicianAsync(station: 5, surname: "Optometrist");
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingVision", currentStation: 5);
        var client = await _world.ClientForAsync(optometrist);

        var response = await client.SubmitAsync(form.FormID, 5,
            StationRequests.Station5(optometrist.PhysicianID, TestWorld.TokenOf(form)));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Completed", (await response.JsonAsync()).GetProperty("status").GetString());

        var stored = await _world.FindFormAsync(form.FormID);
        Assert.Equal(optometrist.PhysicianID, stored!.OptometristID);
        Assert.NotNull(stored.Station5SubmittedAt);
        var vision = await _world.WithDbAsync(db => db.VisionAssessments.SingleAsync(v => v.FormID == form.FormID));
        Assert.Equal("20/25", vision.VisualAcuityLeftEye);
    }

    [Fact]
    public async Task A_whole_visit_runs_on_the_rowVersion_each_response_hands_back()
    {
        var admin = await _world.AddAdminAsync();
        var doctor = await _world.AddPhysicianAsync(station: 3);
        var dentist = await _world.AddPhysicianAsync(station: 4);
        var optometrist = await _world.AddPhysicianAsync(station: 5);
        var (questionID, optionID, _) = await _world.AddAssessmentQuestionAsync();
        var client = await _world.ClientForAsync(admin);

        var registered = await (await client.PostAsJsonAsync("/api/wellnessforms/station1",
            StationRequests.Station1($"EMP-{Guid.NewGuid():N}"[..20], $"m{Guid.NewGuid():N}"[..12]))).JsonAsync();
        var formID = registered.GetProperty("formID").GetInt32();

        string Token(System.Text.Json.JsonElement form) => form.GetProperty("rowVersion").GetString()!;

        var assessed = await client.SubmitAsync(formID, 2, StationRequests.Station2(Token(registered), (questionID, optionID)));
        Assert.Equal(HttpStatusCode.OK, assessed.StatusCode);
        var consulted = await client.SubmitAsync(formID, 3, StationRequests.Station3(doctor.PhysicianID, Token(await assessed.JsonAsync())));
        Assert.Equal(HttpStatusCode.OK, consulted.StatusCode);
        var examined = await client.SubmitAsync(formID, 4, StationRequests.Station4(dentist.PhysicianID, Token(await consulted.JsonAsync())));
        Assert.Equal(HttpStatusCode.OK, examined.StatusCode);
        var completed = await client.SubmitAsync(formID, 5, StationRequests.Station5(optometrist.PhysicianID, Token(await examined.JsonAsync())));
        Assert.Equal(HttpStatusCode.OK, completed.StatusCode);

        var audit = await _world.WithDbAsync(db => db.WellnessFormAuditLogs
            .Where(l => l.FormID == formID).OrderBy(l => l.LogID).Select(l => l.Action).ToListAsync());
        Assert.Equal(
            ["Station1Submitted", "Station2Submitted", "Station3Submitted", "Station4Submitted", "Station5Submitted"],
            audit);
    }
}

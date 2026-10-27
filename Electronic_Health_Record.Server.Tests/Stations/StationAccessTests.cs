using System.Net;
using System.Net.Http.Json;
using Electronic_Health_Record.Server.Tests.Infrastructure;

namespace Electronic_Health_Record.Server.Tests.Stations;

/// <summary>Who may read and write a wellness form.</summary>
public class StationAccessTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    [Fact]
    public async Task Turns_away_a_request_with_no_token()
    {
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingConsultation", currentStation: 3);
        var doctor = await _world.AddPhysicianAsync(station: 3);

        var submit = await _world.AnonymousClient().SubmitAsync(form.FormID, 3,
            StationRequests.Station3(doctor.PhysicianID, TestWorld.TokenOf(form)));
        var read = await _world.AnonymousClient().GetAsync($"/api/wellnessforms/{form.FormID}");

        Assert.Equal(HttpStatusCode.Unauthorized, submit.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, read.StatusCode);
        Assert.Null((await _world.FindFormAsync(form.FormID))!.SignedAt);
    }

    [Fact]
    public async Task Rejects_a_token_signed_with_another_key()
    {
        var client = _world.AnonymousClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer",
            "eyJhbGciOiJIUzI1NiJ9.eyJQcmluY2lwYWxUeXBlIjoiQWRtaW4ifQ.c2lnbmVkLWVsc2V3aGVyZQ");

        var response = await client.GetAsync("/api/wellnessforms");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Keeps_registration_and_assessment_to_admins()
    {
        var patient = await _world.AddPatientAsync();
        var account = await _world.AddPatientAccountAsync(patient.PatientID);
        var form = await _world.AddFormAsync(patient.PatientID, "PendingAssessment", currentStation: 2);
        var (questionID, optionID, _) = await _world.AddAssessmentQuestionAsync();

        foreach (var client in new[]
        {
            await _world.ClientForAsync(account),
            await _world.ClientForAsync(await _world.AddPhysicianAsync(station: 3)),
        })
        {
            var register = await client.PostAsJsonAsync("/api/wellnessforms/station1",
                StationRequests.Station1($"EMP-{Guid.NewGuid():N}"[..20], $"m{Guid.NewGuid():N}"[..12]));
            var assess = await client.SubmitAsync(form.FormID, 2,
                StationRequests.Station2(TestWorld.TokenOf(form), (questionID, optionID)));

            Assert.Equal(HttpStatusCode.Unauthorized, register.StatusCode);
            Assert.Equal(HttpStatusCode.Unauthorized, assess.StatusCode);
        }

        Assert.Equal("PendingAssessment", (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Fact]
    public async Task Lets_a_patient_read_only_their_own_forms()
    {
        var mine = await _world.AddPatientAsync();
        var someoneElse = await _world.AddPatientAsync();
        var account = await _world.AddPatientAccountAsync(mine.PatientID);
        var myForm = await _world.AddFormAsync(mine.PatientID, "Completed", currentStation: 5);
        var theirForm = await _world.AddFormAsync(someoneElse.PatientID, "Completed", currentStation: 5);
        var client = await _world.ClientForAsync(account);

        var own = await client.GetAsync($"/api/wellnessforms/{myForm.FormID}");
        var other = await client.GetAsync($"/api/wellnessforms/{theirForm.FormID}");
        var list = await (await client.GetAsync("/api/wellnessforms/mine")).JsonAsync();

        Assert.Equal(HttpStatusCode.OK, own.StatusCode);
        // 404, not 403: a patient cannot even learn that another form exists.
        Assert.Equal(HttpStatusCode.NotFound, other.StatusCode);
        var listed = list.ValueKind == System.Text.Json.JsonValueKind.Array ? list : list.GetProperty("data");
        Assert.All(listed.EnumerateArray(), f => Assert.Equal(mine.PatientID, f.GetProperty("patientID").GetInt32()));
        Assert.Contains(listed.EnumerateArray(), f => f.GetProperty("formID").GetInt32() == myForm.FormID);
    }

    [Theory]
    [InlineData("/api/wellnessforms")]
    [InlineData("/api/wellnessforms?status=PendingConsultation")]
    [InlineData("/api/wellnessforms/stats")]
    public async Task Keeps_the_station_queues_and_form_list_from_patients(string path)
    {
        // The list carries every patient's name and portal username; a patient
        // has /mine for their own.
        var patient = await _world.AddPatientAsync();
        var account = await _world.AddPatientAccountAsync(patient.PatientID);
        await _world.AddFormAsync((await _world.AddPatientAsync()).PatientID, "PendingConsultation", currentStation: 3);
        var client = await _world.ClientForAsync(account);

        var response = await client.GetAsync(path);

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
    }

    [Fact]
    public async Task Serves_the_form_list_to_staff()
    {
        var client = await _world.ClientForAsync(await _world.AddPhysicianAsync(station: 3));

        var response = await client.GetAsync("/api/wellnessforms?status=PendingConsultation");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData(3, "PendingConsultation")]
    [InlineData(4, "PendingDental")]
    [InlineData(5, "PendingVision")]
    public async Task Refuses_a_patient_signing_off_their_own_form(int station, string status)
    {
        // A patient can read their own form, rowVersion included, and the
        // active doctors are listed on the station pages -- so nothing but an
        // identity check stands between them and a self-signed record.
        var patient = await _world.AddPatientAsync();
        var account = await _world.AddPatientAccountAsync(patient.PatientID);
        var form = await _world.AddFormAsync(patient.PatientID, status, (byte)station);
        var doctor = await _world.AddPhysicianAsync(station);
        var client = await _world.ClientForAsync(account);

        object body = station switch
        {
            3 => StationRequests.Station3(doctor.PhysicianID, TestWorld.TokenOf(form)),
            4 => StationRequests.Station4(doctor.PhysicianID, TestWorld.TokenOf(form)),
            _ => StationRequests.Station5(doctor.PhysicianID, TestWorld.TokenOf(form)),
        };
        var response = await client.SubmitAsync(form.FormID, station, body);

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
        Assert.Equal(status, (await _world.FindFormAsync(form.FormID))!.Status);
    }
}

/// <summary>A station only signs the forms waiting at its own desk.</summary>
public class StationOrderTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    [Fact]
    public async Task Refuses_to_complete_a_form_that_skipped_the_earlier_stations()
    {
        var optometrist = await _world.AddPhysicianAsync(station: 5);
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingAssessment", currentStation: 2);
        var client = await _world.ClientForAsync(optometrist);

        var response = await client.SubmitAsync(form.FormID, 5,
            StationRequests.Station5(optometrist.PhysicianID, TestWorld.TokenOf(form)));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("PendingAssessment", (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Fact]
    public async Task Refuses_to_reopen_a_completed_form_from_an_earlier_desk()
    {
        var dentist = await _world.AddPhysicianAsync(station: 4);
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "Completed", currentStation: 5);
        var client = await _world.ClientForAsync(dentist);

        var response = await client.SubmitAsync(form.FormID, 4,
            StationRequests.Station4(dentist.PhysicianID, TestWorld.TokenOf(form)));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("Completed", (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Theory]
    [InlineData(2, "PendingConsultation")]
    [InlineData(3, "PendingAssessment")]
    [InlineData(3, "Completed")]
    [InlineData(4, "PendingConsultation")]
    [InlineData(5, "PendingDental")]
    [InlineData(5, "Cancelled")]
    public async Task Turns_away_every_form_not_waiting_at_the_desk(int station, string status)
    {
        var signer = await _world.AddPhysicianAsync(station == 2 ? 3 : station);
        var (questionID, optionID, _) = await _world.AddAssessmentQuestionAsync();
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, status, currentStation: 3);
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());
        var token = TestWorld.TokenOf(form);

        object body = station switch
        {
            2 => StationRequests.Station2(token, (questionID, optionID)),
            3 => StationRequests.Station3(signer.PhysicianID, token),
            4 => StationRequests.Station4(signer.PhysicianID, token),
            _ => StationRequests.Station5(signer.PhysicianID, token),
        };
        var response = await client.SubmitAsync(form.FormID, station, body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal($"This form is no longer waiting for Station {station}.", await response.ErrorTextAsync());
        Assert.Equal(status, (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Theory]
    [InlineData(3, 4, "PendingConsultation")]
    [InlineData(4, 3, "PendingDental")]
    [InlineData(5, 4, "PendingVision")]
    public async Task Refuses_a_signer_assigned_to_another_desk(int station, int signersDesk, string status)
    {
        // Each picker offers only its own desk's doctors; the API holds the
        // request to the same list, so a dentist cannot sign the consultation.
        var wrongDoctor = await _world.AddPhysicianAsync(signersDesk);
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, status, (byte)station);
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());
        var token = TestWorld.TokenOf(form);

        object body = station switch
        {
            3 => StationRequests.Station3(wrongDoctor.PhysicianID, token),
            4 => StationRequests.Station4(wrongDoctor.PhysicianID, token),
            _ => StationRequests.Station5(wrongDoctor.PhysicianID, token),
        };
        var response = await client.SubmitAsync(form.FormID, station, body);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains($"not assigned to Station {station}", await response.ErrorTextAsync());
        Assert.Equal(status, (await _world.FindFormAsync(form.FormID))!.Status);
    }
}

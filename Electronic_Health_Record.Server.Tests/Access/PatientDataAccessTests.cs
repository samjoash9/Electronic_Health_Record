using System.Net;
using System.Net.Http.Json;
using Electronic_Health_Record.Server.Tests.Infrastructure;

namespace Electronic_Health_Record.Server.Tests.Access;

/// <summary>
/// The staff directories outside the wellness forms -- patients, the HR
/// employee list, billing -- carry other people's personal details, so a
/// patient's own login must not open them.
/// </summary>
public class PatientDataAccessTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    private async Task<(HttpClient Patient, int OtherPatientID)> SignedInPatientAsync()
    {
        var me = await _world.AddPatientAsync();
        var account = await _world.AddPatientAccountAsync(me.PatientID);
        var other = await _world.AddPatientAsync();
        await _world.AddFormAsync(other.PatientID, "Completed", currentStation: 5);
        return (await _world.ClientForAsync(account), other.PatientID);
    }

    [Theory]
    [InlineData("/api/patients")]
    [InlineData("/api/patients/{other}")]
    [InlineData("/api/patients/{other}/forms")]
    [InlineData("/api/patients/has-account/EMP-1")]
    [InlineData("/api/patients/onboarded")]
    [InlineData("/api/patients/smoking-status")]
    [InlineData("/api/employees")]
    [InlineData("/api/employees/EMP-1")]
    [InlineData("/api/employees/search?q=a")]
    [InlineData("/api/billing/forms")]
    [InlineData("/api/billing/forms/1")]
    [InlineData("/api/physicians")]
    [InlineData("/api/physicians/count")]
    [InlineData("/api/physicians/1")]
    [InlineData("/api/admin/1")]
    [InlineData("/api/chargeitems")]
    [InlineData("/api/assessment/wellness-scores")]
    [InlineData("/api/medicalconditions/diagnosed?granularity=year&year=2026")]
    public async Task Keeps_staff_directories_from_a_patient_login(string path)
    {
        var (client, otherPatientID) = await SignedInPatientAsync();

        var response = await client.GetAsync(path.Replace("{other}", otherPatientID.ToString()));

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
    }

    // Everything the /my-record pages request: the form list and detail, the
    // questionnaire template they render answers against, and the visit
    // history PriorStationsPanel loads for the patient's own id.
    [Theory]
    [InlineData("/api/auth/user")]
    [InlineData("/api/wellnessforms/mine")]
    [InlineData("/api/wellnessforms/{form}")]
    [InlineData("/api/assessment/template")]
    [InlineData("/api/patients/{me}/forms")]
    [InlineData("/api/medicalconditions")]
    public async Task Still_serves_the_patient_portal_its_own_record(string path)
    {
        var me = await _world.AddPatientAsync();
        var account = await _world.AddPatientAccountAsync(me.PatientID);
        var form = await _world.AddFormAsync(me.PatientID, "Completed", currentStation: 5);
        var client = await _world.ClientForAsync(account);

        var response = await client.GetAsync(path
            .Replace("{me}", me.PatientID.ToString())
            .Replace("{form}", form.FormID.ToString()));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // Stations 3-5 sign with the physician list and read PriorStationsPanel's
    // history, so these stay staff-wide rather than admin-only.
    [Theory]
    [InlineData("/api/patients/{patient}/forms")]
    [InlineData("/api/physicians")]
    [InlineData("/api/chargeitems")]
    [InlineData("/api/assessment/template")]
    public async Task Serves_the_station_desks_to_a_physician(string path)
    {
        var patient = await _world.AddPatientAsync();
        var client = await _world.ClientForAsync(await _world.AddPhysicianAsync(station: 3));

        var response = await client.GetAsync(path.Replace("{patient}", patient.PatientID.ToString()));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // Registration, onboarding and billing are admin screens; a doctor's login
    // has no page that reads them.
    [Theory]
    [InlineData("/api/patients")]
    [InlineData("/api/patients/has-account/EMP-1")]
    [InlineData("/api/employees")]
    [InlineData("/api/billing/forms")]
    [InlineData("/api/admin/1")]
    public async Task Keeps_admin_screens_from_a_physician(string path)
    {
        var client = await _world.ClientForAsync(await _world.AddPhysicianAsync(station: 3));

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Refuses_a_patient_creating_patient_records()
    {
        var (client, _) = await SignedInPatientAsync();

        var response = await client.PostAsJsonAsync("/api/patients", new
        {
            surname = "INJECTED", firstName = "ROW", birthdate = "1990-01-01", sex = "Male", civilStatus = "Single",
        });

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
    }

    [Fact]
    public async Task Serves_the_patient_list_to_staff()
    {
        var client = await _world.ClientForAsync(await _world.AddAdminAsync());

        var response = await client.GetAsync("/api/patients");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Renders_report_pdfs_for_signed_in_users_only()
    {
        var response = await _world.AnonymousClient().PostAsJsonAsync("/api/reports/analytics-pdf", new { });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

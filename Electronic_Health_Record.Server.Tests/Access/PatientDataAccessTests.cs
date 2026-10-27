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
    [InlineData("/api/patients/onboarded")]
    [InlineData("/api/employees")]
    [InlineData("/api/employees/search?q=a")]
    [InlineData("/api/billing/forms")]
    public async Task Keeps_staff_directories_from_a_patient_login(string path)
    {
        var (client, otherPatientID) = await SignedInPatientAsync();

        var response = await client.GetAsync(path.Replace("{other}", otherPatientID.ToString()));

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
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

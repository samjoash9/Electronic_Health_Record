using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Electronic_Health_Record.Server.Tests.Infrastructure;

namespace Electronic_Health_Record.Server.Tests.Access;

/// <summary>
/// Every account starts on a shared default password, so until it is replaced
/// the server -- not just the client -- must refuse everything except the
/// calls needed to replace it.
/// </summary>
public class PasswordChangeGateTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    private static object NewPassword(string next = "a-better-secret-1") => new
    {
        currentPassword = TestWorld.DefaultPassword,
        newPassword = next,
        confirmPassword = next,
    };

    private async Task<HttpClient> FlaggedPatientAsync()
    {
        var patient = await _world.AddPatientAsync();
        return await _world.ClientForAsync(await _world.AddPatientAccountAsync(patient.PatientID, mustChangePassword: true));
    }

    [Fact]
    public async Task Refuses_a_patient_still_on_the_default_password()
    {
        var client = await FlaggedPatientAsync();

        var response = await client.GetAsync("/api/wellnessforms/mine");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("PasswordChangeRequired", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Refuses_staff_still_on_the_default_password()
    {
        var admin = await _world.ClientForAsync(await _world.AddAdminAsync(mustChangePassword: true));
        var doctor = await _world.ClientForAsync(await _world.AddPhysicianAsync(station: 3, mustChangePassword: true));

        Assert.Equal(HttpStatusCode.Forbidden, (await admin.GetAsync("/api/wellnessforms")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await doctor.GetAsync("/api/physicians")).StatusCode);
    }

    [Fact]
    public async Task Still_lets_a_flagged_account_read_itself_and_sign_out()
    {
        var client = await FlaggedPatientAsync();

        var user = await client.GetAsync("/api/auth/user");
        var logout = await client.PostAsync("/api/auth/logout", null);

        Assert.Equal(HttpStatusCode.OK, user.StatusCode);
        var body = await user.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("mustChangePassword").GetBoolean());
        Assert.NotEqual(HttpStatusCode.Forbidden, logout.StatusCode);
    }

    [Fact]
    public async Task Reports_the_flag_at_login()
    {
        var admin = await _world.AddAdminAsync(mustChangePassword: true);

        var response = await _world.AnonymousClient().PostAsJsonAsync("/api/auth/login", new
        {
            username = admin.Username,
            password = TestWorld.DefaultPassword,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("mustChangePassword").GetBoolean());
    }

    [Fact]
    public async Task Opens_up_once_a_patient_changes_the_password()
    {
        var client = await FlaggedPatientAsync();

        var change = await client.PostAsJsonAsync("/api/auth/change-password", NewPassword());

        Assert.Equal(HttpStatusCode.OK, change.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/wellnessforms/mine")).StatusCode);
    }

    [Fact]
    public async Task Opens_up_once_an_admin_changes_the_password()
    {
        var client = await _world.ClientForAsync(await _world.AddAdminAsync(mustChangePassword: true));

        var change = await client.PostAsJsonAsync("/api/auth/change-password", NewPassword());

        Assert.Equal(HttpStatusCode.OK, change.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/wellnessforms")).StatusCode);
    }

    [Fact]
    public async Task Opens_up_once_a_physician_changes_the_password()
    {
        var client = await _world.ClientForAsync(await _world.AddPhysicianAsync(station: 3, mustChangePassword: true));

        var change = await client.PostAsJsonAsync("/api/auth/change-password", NewPassword());

        Assert.Equal(HttpStatusCode.OK, change.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/physicians")).StatusCode);
    }
}

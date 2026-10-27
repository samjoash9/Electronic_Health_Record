using System.Net;
using Electronic_Health_Record.Server.Tests.Infrastructure;

namespace Electronic_Health_Record.Server.Tests.Stations;

/// <summary>
/// What the signing desks refuse. The client disables its submit button in
/// each of these cases too, but a disabled button is not a security boundary:
/// these are the checks that actually keep an unsigned or misattributed
/// record out of the database.
/// </summary>
public class StationSignOffRulesTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    /// <summary>Where a form waits for a station, and that station's request.</summary>
    private static readonly Dictionary<int, (string Status, byte CurrentStation, Func<int?, string, string?, object> Body)> Desks = new()
    {
        [3] = ("PendingConsultation", 3, (signer, token, signature) => StationRequests.Station3(signer, token, signature)),
        [4] = ("PendingDental", 4, (signer, token, signature) => StationRequests.Station4(signer, token, signature)),
        [5] = ("PendingVision", 5, (signer, token, signature) => StationRequests.Station5(signer, token, signature)),
    };

    private async Task<(Models.WellnessForm Form, Models.Physician Signer, HttpClient Client)> FormWaitingAtAsync(int station)
    {
        var signer = await _world.AddPhysicianAsync(station);
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, Desks[station].Status, Desks[station].CurrentStation);
        return (form, signer, await _world.ClientForAsync(signer));
    }

    [Theory]
    [InlineData(3, "A physician signature is required before submitting.")]
    [InlineData(4, "A dentist signature is required before submitting.")]
    [InlineData(5, "An optometrist signature is required before submitting.")]
    public async Task Refuses_to_sign_without_a_signature(int station, string reason)
    {
        var (form, signer, client) = await FormWaitingAtAsync(station);

        foreach (var signature in new[] { null, "" })
        {
            var response = await client.SubmitAsync(form.FormID, station,
                Desks[station].Body(signer.PhysicianID, TestWorld.TokenOf(form), signature));

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Contains(reason, await response.ErrorTextAsync());
        }

        Assert.Equal(Desks[station].Status, (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Theory]
    [InlineData(3, "attending physician")]
    [InlineData(4, "examining dentist")]
    [InlineData(5, "examining optometrist")]
    public async Task Refuses_to_sign_without_a_signer(int station, string who)
    {
        var (form, _, client) = await FormWaitingAtAsync(station);

        var response = await client.SubmitAsync(form.FormID, station,
            Desks[station].Body(null, TestWorld.TokenOf(form), TestWorld.Signature));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains(who, await response.ErrorTextAsync());
        Assert.Equal(Desks[station].Status, (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Theory]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task Refuses_a_deactivated_signer(int station)
    {
        var (form, _, client) = await FormWaitingAtAsync(station);
        var retired = await _world.AddPhysicianAsync(station, isActive: false);

        var response = await client.SubmitAsync(form.FormID, station,
            Desks[station].Body(retired.PhysicianID, TestWorld.TokenOf(form), TestWorld.Signature));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Contains("no longer registered as active", await response.ErrorTextAsync());
    }

    [Theory]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task Refuses_a_signer_id_that_does_not_exist(int station)
    {
        var (form, _, client) = await FormWaitingAtAsync(station);

        var response = await client.SubmitAsync(form.FormID, station,
            Desks[station].Body(int.MaxValue, TestWorld.TokenOf(form), TestWorld.Signature));

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        Assert.Null((await _world.FindFormAsync(form.FormID))!.SignedAt);
    }

    [Theory]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task Answers_404_for_a_form_that_does_not_exist(int station)
    {
        var (form, signer, client) = await FormWaitingAtAsync(station);

        var response = await client.SubmitAsync(int.MaxValue, station,
            Desks[station].Body(signer.PhysicianID, TestWorld.TokenOf(form), TestWorld.Signature));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}

/// <summary>
/// Two desks working from the same copy of a form: the second write must be
/// turned away rather than silently overwrite the first.
/// </summary>
public class StaleWriteTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private readonly TestWorld _world = new(factory);

    [Theory]
    [InlineData(2, "PendingAssessment")]
    [InlineData(3, "PendingConsultation")]
    [InlineData(4, "PendingDental")]
    [InlineData(5, "PendingVision")]
    public async Task Refuses_a_submit_on_a_form_changed_since_it_was_read(int station, string status)
    {
        var admin = await _world.AddAdminAsync();
        var signer = await _world.AddPhysicianAsync(station == 2 ? 3 : station);
        var (questionID, optionID, _) = await _world.AddAssessmentQuestionAsync();
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, status, (byte)station);
        var staleToken = TestWorld.TokenOf(form);

        // Another desk saves the form in between without moving it on (any
        // write bumps the rowversion).
        await _world.WithDbAsync(async db =>
        {
            var row = await db.WellnessForms.FindAsync(form.FormID);
            row!.UpdatedAt = DateTime.UtcNow;
            return await db.SaveChangesAsync();
        });

        var client = await _world.ClientForAsync(admin);
        object body = station switch
        {
            2 => StationRequests.Station2(staleToken, (questionID, optionID)),
            3 => StationRequests.Station3(signer.PhysicianID, staleToken),
            4 => StationRequests.Station4(signer.PhysicianID, staleToken),
            _ => StationRequests.Station5(signer.PhysicianID, staleToken),
        };
        var response = await client.SubmitAsync(form.FormID, station, body);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal("This record was changed at another station.", await response.ErrorTextAsync());
        Assert.Equal(status, (await _world.FindFormAsync(form.FormID))!.Status);
    }

    [Fact]
    public async Task Requires_the_rowVersion_on_every_submit()
    {
        var signer = await _world.AddPhysicianAsync(station: 3);
        var patient = await _world.AddPatientAsync();
        var form = await _world.AddFormAsync(patient.PatientID, "PendingConsultation", currentStation: 3);
        var client = await _world.ClientForAsync(signer);

        var response = await client.SubmitAsync(form.FormID, 3, StationRequests.Station3(signer.PhysicianID, rowVersion: ""));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("RowVersion", await response.ErrorTextAsync(), StringComparison.OrdinalIgnoreCase);
    }
}

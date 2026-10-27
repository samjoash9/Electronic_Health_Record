using System.Net.Http.Json;
using System.Text.Json;

namespace Electronic_Health_Record.Server.Tests.Infrastructure;

/// <summary>
/// The request bodies the client sends, key for key -- see submitStation1..5
/// in src/api/forms.api.js and forms.api.test.js, which pins the same shapes
/// from the other side. A rename on either end breaks one of the two suites.
/// </summary>
public static class StationRequests
{
    public static object Station1(string externalEmployeeId, string? username) => new
    {
        patient = new
        {
            externalEmployeeId,
            surname = "SANTOS",
            firstName = "MARIA",
            middleName = "A",
            birthdate = "1985-04-12",
            sex = "Female",
            civilStatus = "Married",
            address = "1 Rizal Street",
            agencyOffice = "Provincial Health Office",
            position = "Nurse II",
            contactNo = "09171234567",
            username,
        },
        vitals = new
        {
            weightKg = 62, heightCm = 158, bmi = 24.8, idealBMI = 22,
            bpSystolic = 118, bpDiastolic = 76, tempCelsius = 36.6,
            heartRate = 72, respRate = 16,
        },
    };

    public static object Station2(string rowVersion, params (int QuestionID, int OptionID)[] answers) => new
    {
        answers = answers.Select(a => new { questionID = a.QuestionID, optionID = a.OptionID }),
        rowVersion,
    };

    // The consultation spread flat beside physicianID and rowVersion, as
    // submitStation3 sends it.
    public static object Station3(int? physicianID, string rowVersion, string? signature = TestWorld.Signature) => new
    {
        physicianID,
        familyMedicalHistory = Array.Empty<object>(),
        pastMedicalHistory = Array.Empty<object>(),
        exercise = Array.Empty<object>(),
        socialHistory = new { smokes = false },
        recommendedDiagnosticTest = (string?)null,
        impressionClinical = "Well",
        managementTreatment = "Continue current regimen",
        charges = Array.Empty<object>(),
        signature,
        rowVersion,
    };

    public static object Station4(int? dentistID, string rowVersion, string? dentalSignature = TestWorld.Signature) => new
    {
        dentistID,
        dentalAssessment = new { oralHygieneStatus = "Fair", oralHygieneStatusRemarks = "Plaque on lower incisors" },
        dentalSignature,
        rowVersion,
    };

    public static object Station5(int? optometristID, string rowVersion, string? visionSignature = TestWorld.Signature) => new
    {
        optometristID,
        visionAssessment = new { visualAcuityRightEye = "20/20", visualAcuityLeftEye = "20/25" },
        visionSignature,
        rowVersion,
    };

    public static Task<HttpResponseMessage> SubmitAsync(this HttpClient client, int formID, int station, object body) =>
        client.PostAsJsonAsync($"/api/wellnessforms/{formID}/station{station}", body);

    public static async Task<JsonElement> JsonAsync(this HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();

    /// <summary>The error text the client's toApiError would show: `message`, else the ModelState reasons.</summary>
    public static async Task<string> ErrorTextAsync(this HttpResponseMessage response)
    {
        var body = await response.JsonAsync();
        if (body.TryGetProperty("message", out var message)) return message.GetString() ?? string.Empty;
        if (body.TryGetProperty("errors", out var errors))
        {
            return string.Join(" ", errors.EnumerateObject()
                .SelectMany(field => field.Value.EnumerateArray())
                .Select(reason => reason.GetString()));
        }
        return body.ToString();
    }
}

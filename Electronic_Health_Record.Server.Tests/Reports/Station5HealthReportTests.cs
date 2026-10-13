using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class Station5HealthReportTests
{
    // A fully answered exam with no symptoms; each test changes only what it is about.
    private static readonly Station5Exam Clear = new(
        FormID: 1, PatientID: 1, FormDate: new DateTime(2026, 9, 1),
        History: "No", EyePain: "No", Blurred: "No", Near: "No", Distant: "No");

    [Fact]
    public void Counts_screenings_and_each_patient_once_from_their_latest()
    {
        var report = Station5HealthReport.Build(
        [
            Clear with { FormID = 1, PatientID = 7, FormDate = new DateTime(2026, 3, 1), Blurred = "Yes" },
            Clear with { FormID = 2, PatientID = 7 },
        ]);

        Assert.Equal(2, report.Screenings);
        Assert.Equal(1, report.Patients);
        Assert.Equal(new YesCount(0, 1), report.Symptoms["blurred"]);
    }

    [Fact]
    public void Counts_yes_answers_over_the_patients_who_answered()
    {
        var report = Station5HealthReport.Build(
        [
            Clear with { FormID = 1, PatientID = 1, Near = "Yes", Distant = null },
            Clear with { FormID = 2, PatientID = 2, Near = "Yes", EyePain = "Yes" },
            Clear with { FormID = 3, PatientID = 3, Near = null },
        ]);

        Assert.Equal(new YesCount(2, 2), report.Symptoms["near"]);
        Assert.Equal(new YesCount(0, 2), report.Symptoms["distant"]);
        Assert.Equal(new YesCount(1, 3), report.Symptoms["eyePain"]);
    }

    [Fact]
    public void Lists_the_five_symptoms_in_the_forms_order()
    {
        var report = Station5HealthReport.Build([]);

        Assert.Equal(new[] { "history", "eyePain", "blurred", "near", "distant" }, report.Symptoms.Keys);
        Assert.All(report.Symptoms.Values, s => Assert.Equal(new YesCount(0, 0), s));
        Assert.Equal(0, report.Screenings);
    }
}

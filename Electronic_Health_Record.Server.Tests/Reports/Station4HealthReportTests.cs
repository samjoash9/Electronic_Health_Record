using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class Station4HealthReportTests
{
    // A fully answered, healthy exam; each test changes only what it is about.
    private static readonly Station4Exam Healthy = new(
        FormID: 1, PatientID: 1, FormDate: new DateTime(2026, 9, 1),
        OralHygiene: "Good", Caries: "None", Gum: "Healthy", TreatmentNeed: "None");

    [Fact]
    public void Counts_screenings_and_each_patient_once_from_their_latest()
    {
        var report = Station4HealthReport.Build(
        [
            Healthy with { FormID = 1, PatientID = 7, FormDate = new DateTime(2026, 3, 1), OralHygiene = "Poor", Caries = "Present" },
            Healthy with { FormID = 2, PatientID = 7 },
        ]);

        Assert.Equal(2, report.Screenings);
        Assert.Equal(1, report.Patients);
        Assert.Equal(1, report.Hygiene["good"]);
        Assert.Equal(0, report.Hygiene["poor"]);
        Assert.Equal(0, report.Caries["present"]);
    }

    [Fact]
    public void Counts_every_option_the_form_offers()
    {
        var report = Station4HealthReport.Build(
        [
            Healthy with { FormID = 1, PatientID = 1, OralHygiene = "Fair", Gum = "Gingivitis", TreatmentNeed = "Preventive Care" },
            Healthy with { FormID = 2, PatientID = 2, OralHygiene = "Poor", Gum = "Suspected Periodontal Problem", Caries = "Present", TreatmentNeed = "Restorative Treatment" },
            Healthy with { FormID = 3, PatientID = 3, TreatmentNeed = "Extraction" },
            Healthy with { FormID = 4, PatientID = 4, TreatmentNeed = "Other" },
        ]);

        Assert.Equal(new Dictionary<string, int> { ["good"] = 2, ["fair"] = 1, ["poor"] = 1 }, report.Hygiene);
        Assert.Equal(new Dictionary<string, int> { ["healthy"] = 2, ["gingivitis"] = 1, ["periodontal"] = 1 }, report.Gum);
        Assert.Equal(new Dictionary<string, int> { ["none"] = 3, ["present"] = 1 }, report.Caries);
        Assert.Equal(
            new Dictionary<string, int> { ["none"] = 0, ["preventive"] = 1, ["restorative"] = 1, ["extraction"] = 1, ["other"] = 1 },
            report.TreatmentNeed);
    }

    [Fact]
    public void Leaves_an_unanswered_question_out_of_its_counts()
    {
        var report = Station4HealthReport.Build(
        [
            Healthy with { FormID = 1, PatientID = 1, OralHygiene = null, Caries = null },
            Healthy with { FormID = 2, PatientID = 2 },
        ]);

        Assert.Equal(2, report.Patients);
        Assert.Equal(1, report.Hygiene.Values.Sum());
        Assert.Equal(1, report.Caries.Values.Sum());
        Assert.Equal(2, report.Gum.Values.Sum());
    }

    [Fact]
    public void Answers_an_empty_period_with_every_option_at_zero()
    {
        var report = Station4HealthReport.Build([]);

        Assert.Equal(0, report.Screenings);
        Assert.Equal(new[] { "good", "fair", "poor" }, report.Hygiene.Keys);
        Assert.Equal(new[] { "none", "preventive", "restorative", "extraction", "other" }, report.TreatmentNeed.Keys);
        Assert.All(report.Gum.Values, n => Assert.Equal(0, n));
    }
}

using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class Station1HealthReportTests
{
    private const string Health = "PROVINCIAL HEALTH OFFICE";
    private const string Engineering = "PROVINCIAL ENGINEERING OFFICE";

    // A normal-BMI, normal-BP visit; each test changes only what it is about.
    private static readonly Station1Visit Healthy = new(
        FormID: 1, PatientID: 1, FormDate: new DateTime(2026, 9, 1), Office: Health,
        Bmi: 21m, Systolic: 110, Diastolic: 70);

    [Fact]
    public void Counts_a_patient_once_from_their_latest_visit()
    {
        var report = Station1HealthReport.Build(new[]
        {
            Healthy with { FormID = 1, PatientID = 7, FormDate = new DateTime(2026, 3, 1), Bmi = 31m, Systolic = 150, Diastolic = 95 },
            Healthy with { FormID = 2, PatientID = 7, FormDate = new DateTime(2026, 9, 1) },
        }, office: null);

        Assert.Equal(2, report.Visits);
        Assert.Equal(1, report.Patients);
        Assert.Equal(1, report.Bmi["normal"]);
        Assert.Equal(0, report.Bmi["obese2"]);
        Assert.Equal(1, report.Bp["normal"]);
        Assert.Equal(0, report.Bp["stage2"]);
    }

    [Fact]
    public void Leaves_a_missing_reading_out_of_its_tally()
    {
        var report = Station1HealthReport.Build(new[]
        {
            Healthy with { FormID = 1, PatientID = 1, Bmi = null },
            Healthy with { FormID = 2, PatientID = 2, Systolic = null },
            Healthy with { FormID = 3, PatientID = 3 },
        }, office: null);

        Assert.Equal(3, report.Patients);
        Assert.Equal(2, report.Bmi.Values.Sum());
        Assert.Equal(2, report.Bp.Values.Sum());
    }

    [Fact]
    public void Answers_every_class_even_when_nobody_is_in_it()
    {
        var report = Station1HealthReport.Build(Array.Empty<Station1Visit>(), office: null);

        Assert.Equal(0, report.Visits);
        Assert.Equal(0, report.Patients);
        Assert.Equal(new[] { "underweight", "normal", "overweight", "obese1", "obese2" }, report.Bmi.Keys);
        Assert.Equal(new[] { "normal", "elevated", "stage1", "stage2", "crisis" }, report.Bp.Keys);
        Assert.All(report.Bmi.Values.Concat(report.Bp.Values), n => Assert.Equal(0, n));
        Assert.Empty(report.ByOffice);
    }

    [Fact]
    public void Office_filter_narrows_the_figures_but_not_the_office_comparison()
    {
        var visits = new[]
        {
            Healthy with { FormID = 1, PatientID = 1, Office = Health, Bmi = 31m },
            Healthy with { FormID = 2, PatientID = 2, Office = Engineering },
            Healthy with { FormID = 3, PatientID = 3, Office = Engineering },
        };

        var report = Station1HealthReport.Build(visits, office: Health);

        Assert.Equal(1, report.Visits);
        Assert.Equal(1, report.Patients);
        Assert.Equal(1, report.Bmi["obese2"]);
        Assert.Equal(new[] { new OfficeCount(Engineering, 2), new OfficeCount(Health, 1) }, report.ByOffice);
    }

    [Fact]
    public void Office_filter_ignores_case_and_surrounding_spaces()
    {
        var report = Station1HealthReport.Build(
            new[] { Healthy with { Office = "  provincial health office " } },
            office: Health);

        Assert.Equal(1, report.Patients);
    }

    [Fact]
    public void Counts_patients_per_office_most_first_with_no_office_after_its_ties()
    {
        var report = Station1HealthReport.Build(new[]
        {
            Healthy with { FormID = 1, PatientID = 1, Office = Health },
            Healthy with { FormID = 2, PatientID = 1, Office = Health, FormDate = new DateTime(2026, 9, 5) },
            Healthy with { FormID = 3, PatientID = 2, Office = "provincial health office" },
            Healthy with { FormID = 4, PatientID = 3, Office = Engineering },
            Healthy with { FormID = 5, PatientID = 4, Office = "   " },
            Healthy with { FormID = 6, PatientID = 5, Office = null },
            Healthy with { FormID = 7, PatientID = 6, Office = "D.O.P. MEMORIAL HOSPITAL" },
        }, office: null);

        Assert.Equal(new[]
        {
            new OfficeCount(Health, 2),
            new OfficeCount(null, 2),
            new OfficeCount("D.O.P. MEMORIAL HOSPITAL", 1),
            new OfficeCount(Engineering, 1),
        }, report.ByOffice);
    }
}

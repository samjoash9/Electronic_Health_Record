using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class Station3HealthReportTests
{
    private static readonly DateTime March = new(2026, 3, 1);
    private static readonly DateTime September = new(2026, 9, 1);

    private static Station3Consult Consult(int formId, int patientId, DateTime? date = null) =>
        new(formId, patientId, date ?? September);

    private static Station3Charge Lab(int formId, string name) => new(formId, ChargeItemType.Lab, name);
    private static Station3Charge Med(int formId, string name) => new(formId, ChargeItemType.Medication, name);

    private static Station3Social Social(
        int formId, bool? smokes = false, bool cigarette = false, bool ecig = false, string? drinks = null) =>
        new(formId, smokes, cigarette, ecig, drinks);

    private static Station3HealthReport Build(
        IEnumerable<Station3Consult> consults,
        IEnumerable<Station3Charge>? charges = null,
        IEnumerable<Station3History>? histories = null,
        IEnumerable<Station3Social>? social = null,
        IEnumerable<Station3Exercise>? exercises = null) =>
        Station3HealthReport.Build(
            consults.ToList(),
            (charges ?? []).ToList(),
            (histories ?? []).ToList(),
            (social ?? []).ToList(),
            (exercises ?? []).ToList());

    [Fact]
    public void Counts_consultations_and_each_patient_once()
    {
        var report = Build([Consult(1, 7, March), Consult(2, 7), Consult(3, 8)]);

        Assert.Equal(3, report.Consultations);
        Assert.Equal(2, report.Patients);
    }

    [Fact]
    public void Counts_consultations_that_prescribed_or_ordered_labs_once_each()
    {
        var report = Build(
            [Consult(1, 1), Consult(2, 2), Consult(3, 3)],
            charges:
            [
                Med(1, "Losartan"), Med(1, "Metformin"), Lab(1, "CBC"),
                Med(2, "Paracetamol"),
                Lab(99, "CBC"), // not a consultation in range
            ]);

        Assert.Equal(2, report.WithPrescription);
        Assert.Equal(1, report.WithLabs);
    }

    [Fact]
    public void Ranks_labs_by_the_consultations_that_ordered_them_whatever_their_spelling()
    {
        var report = Build(
            [Consult(1, 1), Consult(2, 2), Consult(3, 3)],
            charges:
            [
                Lab(1, "Lipid Profile"), Lab(2, "lipid  profile "), Lab(3, "Lipid Profile"),
                Lab(1, "CBC"), Lab(1, "CBC"), // one consultation, ordered twice
                Lab(2, "FBS"),
            ]);

        Assert.Equal(
            [new OrderTally("Lipid Profile", 3), new OrderTally("CBC", 1), new OrderTally("FBS", 1)],
            report.Labs);
    }

    [Fact]
    public void Keeps_the_ten_most_prescribed_medications()
    {
        var consults = Enumerable.Range(1, 12).Select(i => Consult(i, i)).ToList();
        var charges = consults.SelectMany(c => Enumerable.Range(1, c.FormID).Select(m => Med(c.FormID, $"Drug {m:00}")));

        var report = Build(consults, charges: charges);

        Assert.Equal(10, report.Medications.Count);
        Assert.Equal(new OrderTally("Drug 01", 12), report.Medications[0]);
        Assert.Equal(new OrderTally("Drug 10", 3), report.Medications[9]);
    }

    [Fact]
    public void Takes_history_from_each_patients_latest_consultation_only()
    {
        var report = Build(
            [Consult(1, 7, March), Consult(2, 7)],
            histories:
            [
                new Station3History(1, null, "Asthma", "Salbutamol"),
                new Station3History(2, null, "Hypertension", "Losartan"),
            ]);

        Assert.Equal([new PatientTally("Hypertension", 1)], report.Conditions);
        Assert.Equal([new PatientTally("Losartan", 1)], report.MaintenanceDrugs);
    }

    [Fact]
    public void Names_a_condition_by_its_free_text_before_its_catalog_entry_and_merges_spellings()
    {
        var report = Build(
            [Consult(1, 1), Consult(2, 2), Consult(3, 3)],
            histories:
            [
                new Station3History(1, "ARTHRITIS", null, null),
                new Station3History(2, null, "arthritis", null),
                new Station3History(3, "ARTHRITIS", "Gout", null),
            ]);

        Assert.Equal([new PatientTally("ARTHRITIS", 2), new PatientTally("Gout", 1)], report.Conditions);
    }

    [Fact]
    public void Leaves_out_none_and_other_placeholders()
    {
        var report = Build(
            [Consult(1, 1), Consult(2, 2), Consult(3, 3)],
            histories:
            [
                new Station3History(1, "NONE", null, "n/a"),
                new Station3History(2, null, " none ", "-"),
                new Station3History(3, null, "N/A", "Nil"),
            ]);

        Assert.Empty(report.Conditions);
        Assert.Empty(report.MaintenanceDrugs);
    }

    [Fact]
    public void Splits_smokers_by_what_they_smoke_and_skips_the_unanswered()
    {
        var report = Build(
            Enumerable.Range(1, 6).Select(i => Consult(i, i)),
            social:
            [
                Social(1, smokes: false),
                Social(2, smokes: true, cigarette: true),
                Social(3, smokes: true, ecig: true),
                Social(4, smokes: true, cigarette: true, ecig: true),
                Social(5, smokes: true),
                Social(6, smokes: null),
            ]);

        Assert.Equal(new SmokingCounts(NonSmoker: 1, Cigarette: 1, Ecig: 1, Both: 1, Unspecified: 1), report.Smoking);
    }

    [Fact]
    public void Groups_the_six_drinking_answers_into_four_and_skips_the_unanswered()
    {
        string?[] answers = ["Never", "Occasionally", "Monthly", "Weekly", "Several times a week", "daily", null, ""];
        var report = Build(
            answers.Select((_, i) => Consult(i + 1, i + 1)),
            social: answers.Select((a, i) => Social(i + 1, drinks: a)));

        Assert.Equal(new AlcoholCounts(Never: 1, Occasional: 2, Weekly: 1, Frequent: 2), report.Alcohol);
    }

    [Fact]
    public void Counts_exercisers_once_and_keeps_the_five_most_common_activities()
    {
        var report = Build(
            Enumerable.Range(1, 4).Select(i => Consult(i, i)),
            exercises:
            [
                new Station3Exercise(1, "Walking"), new Station3Exercise(1, "walking"),
                new Station3Exercise(2, "Walking"), new Station3Exercise(2, "Jogging"),
                new Station3Exercise(3, "Zumba"), new Station3Exercise(3, "Cycling"),
                new Station3Exercise(3, "Swimming"), new Station3Exercise(3, "Badminton"),
                new Station3Exercise(4, "  "),
            ]);

        Assert.Equal(3, report.Exercise.Patients);
        Assert.Equal(5, report.Exercise.Top.Count);
        Assert.Equal(new PatientTally("Walking", 2), report.Exercise.Top[0]);
        Assert.Equal(["Badminton", "Cycling", "Jogging", "Swimming"], report.Exercise.Top.Skip(1).Select(t => t.Name));
    }

    [Fact]
    public void Names_a_group_by_its_most_common_spelling()
    {
        var report = Build(
            [Consult(1, 1), Consult(2, 2), Consult(3, 3)],
            charges: [Med(1, "losartan"), Med(2, "Losartan"), Med(3, "Losartan")]);

        Assert.Equal("Losartan", Assert.Single(report.Medications).Name);
    }

    [Fact]
    public void Answers_an_empty_period_with_zeros()
    {
        var report = Build([]);

        Assert.Equal(0, report.Consultations);
        Assert.Equal(0, report.Patients);
        Assert.Empty(report.Labs);
        Assert.Equal(new SmokingCounts(0, 0, 0, 0, 0), report.Smoking);
        Assert.Equal(new AlcoholCounts(0, 0, 0, 0), report.Alcohol);
        Assert.Equal(0, report.Exercise.Patients);
    }
}

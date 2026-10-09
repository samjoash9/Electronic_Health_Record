using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class Station2HealthReportTests
{
    // Two of the seven seeded aspects; CategoryID 7 is Financial, 2 is Physical.
    private const int Financial = 7;
    private const int Physical = 2;

    private static readonly AssessmentCategory[] Categories =
    {
        new() { CategoryID = Financial, Name = "Financial", DisplayOrder = 6 },
        new() { CategoryID = Physical, Name = "Physical", DisplayOrder = 5 },
    };

    // Every question's best option scores 4, as in the seeded questionnaire.
    private static readonly Dictionary<int, int> BestOf4 = Enumerable.Range(1, 20).ToDictionary(q => q, _ => 4);

    private static Station2HealthReport Build(int assessments, params Station2Answer[] answers) =>
        Station2HealthReport.Build(assessments, answers, BestOf4, Categories);

    private static AspectScore Aspect(Station2HealthReport report, string name) =>
        report.Aspects.Single(a => a.Category == name);

    [Fact]
    public void Pools_points_over_what_the_answered_questions_could_score()
    {
        var report = Build(3,
            new Station2Answer(FormID: 1, QuestionID: 1, CategoryID: Physical, Score: 4),
            new Station2Answer(FormID: 1, QuestionID: 2, CategoryID: Financial, Score: 2),
            new Station2Answer(FormID: 2, QuestionID: 1, CategoryID: Physical, Score: 3));

        Assert.Equal(3, report.Assessments);
        Assert.Equal(2, report.Patients);
        Assert.Equal(75.0, report.OverallScore); // 9 of 12
        Assert.Equal(87.5, Aspect(report, "Physical").Score); // 7 of 8
        Assert.Equal(2, Aspect(report, "Physical").Patients);
        Assert.Equal(50.0, Aspect(report, "Financial").Score);
        Assert.Equal(1, Aspect(report, "Financial").Patients);
    }

    [Fact]
    public void Counts_a_patient_at_risk_in_an_aspect_below_50_but_not_at_50()
    {
        var report = Build(2,
            new Station2Answer(FormID: 1, QuestionID: 1, CategoryID: Financial, Score: 1), // 25%
            new Station2Answer(FormID: 2, QuestionID: 1, CategoryID: Financial, Score: 2)); // 50%

        Assert.Equal(1, Aspect(report, "Financial").AtRisk);
    }

    [Fact]
    public void Judges_at_risk_on_the_patients_own_aspect_score_not_the_pool()
    {
        // One patient at 25% and one at 100%: the pool is 62.5%, yet one is at risk.
        var report = Build(2,
            new Station2Answer(FormID: 1, QuestionID: 1, CategoryID: Financial, Score: 1),
            new Station2Answer(FormID: 2, QuestionID: 1, CategoryID: Financial, Score: 4));

        Assert.Equal(62.5, Aspect(report, "Financial").Score);
        Assert.Equal(1, Aspect(report, "Financial").AtRisk);
    }

    [Fact]
    public void Rounds_a_score_to_one_decimal_before_judging_it_as_the_bands_do()
    {
        // 1249 of 2500 is 49.96%, shown -- and banded -- as 50.0%.
        var report = Station2HealthReport.Build(1,
            new[] { new Station2Answer(FormID: 1, QuestionID: 1, CategoryID: Financial, Score: 1249) },
            new Dictionary<int, int> { [1] = 2500 },
            Categories);

        Assert.Equal(50.0, Aspect(report, "Financial").Score);
        Assert.Equal(0, Aspect(report, "Financial").AtRisk);
    }

    [Fact]
    public void Leaves_an_aspect_nobody_answered_unscored()
    {
        var report = Build(1, new Station2Answer(FormID: 1, QuestionID: 1, CategoryID: Physical, Score: 4));

        var financial = Aspect(report, "Financial");
        Assert.Null(financial.Score);
        Assert.Equal(0, financial.Patients);
        Assert.Equal(0, financial.AtRisk);
    }

    [Fact]
    public void Lists_every_aspect_in_display_order()
    {
        var report = Build(0);

        Assert.Equal(new[] { "Physical", "Financial" }, report.Aspects.Select(a => a.Category));
    }

    [Fact]
    public void Answers_an_empty_period_with_no_score()
    {
        var report = Build(0);

        Assert.Equal(0, report.Assessments);
        Assert.Equal(0, report.Patients);
        Assert.Null(report.OverallScore);
        Assert.All(report.Aspects, a => Assert.Null(a.Score));
    }
}

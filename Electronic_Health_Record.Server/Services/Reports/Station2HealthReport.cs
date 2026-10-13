using Electronic_Health_Record.Server.Models;

namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>One answer on a patient's latest assessment, with the points its option scored.</summary>
    public sealed record Station2Answer(int FormID, int QuestionID, int CategoryID, int Score);

    /// <summary>
    /// One wellness aspect. Score is null when nobody answered it in the
    /// period -- assessments taken before the seven-aspect questionnaire only
    /// cover four. Patients counts those who answered at least one of its
    /// questions; AtRisk those of them whose own score in it is below 50.
    /// </summary>
    public sealed record AspectScore(string Category, double? Score, int Patients, int AtRisk);

    /// <summary>
    /// GET /api/health-reports/station2. Assessments counts assessed visits;
    /// the rest comes from each patient's latest assessment in the range.
    /// Scores pool as AssessmentController.GetWellnessScores does: points over
    /// what the answered questions could have scored, so an unanswered
    /// question is left out rather than counted as zero.
    /// </summary>
    public sealed record Station2HealthReport(
        int Assessments,
        int Patients,
        double? OverallScore,
        List<AspectScore> Aspects)
    {
        /// <summary>The "support" band's ceiling (ReportClassifiers.WellnessBand).</summary>
        public const double AtRiskBelow = 50;

        /// <summary>
        /// latestAnswers: the answers on each patient's latest assessed visit,
        /// so one form per patient. bestByQuestion: what each question's best
        /// option scores.
        /// </summary>
        public static Station2HealthReport Build(
            int assessments,
            IReadOnlyCollection<Station2Answer> latestAnswers,
            IReadOnlyDictionary<int, int> bestByQuestion,
            IEnumerable<AssessmentCategory> categories)
        {
            int Best(Station2Answer a) => bestByQuestion.GetValueOrDefault(a.QuestionID);

            var byCategory = latestAnswers.ToLookup(a => a.CategoryID);

            var aspects = categories
                .OrderBy(c => c.DisplayOrder)
                .Select(c =>
                {
                    var answers = byCategory[c.CategoryID].ToList();
                    var perPatient = answers
                        .GroupBy(a => a.FormID)
                        .Select(g => Percent(g.Sum(a => a.Score), g.Sum(Best)))
                        .ToList();

                    return new AspectScore(
                        c.Name,
                        Percent(answers.Sum(a => a.Score), answers.Sum(Best)),
                        perPatient.Count,
                        perPatient.Count(p => p < AtRiskBelow));
                })
                .ToList();

            return new Station2HealthReport(
                assessments,
                latestAnswers.Select(a => a.FormID).Distinct().Count(),
                Percent(latestAnswers.Sum(a => a.Score), latestAnswers.Sum(Best)),
                aspects);
        }

        // To one decimal, the precision the page shows and the bands judge.
        private static double? Percent(int points, int possible) =>
            possible == 0 ? null : Math.Round(100.0 * points / possible, 1);
    }
}

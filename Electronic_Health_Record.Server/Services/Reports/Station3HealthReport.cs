using System.Text.RegularExpressions;
using Electronic_Health_Record.Server.Models;

namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>A completed Station 3 consultation (Station3SubmittedAt set).</summary>
    public sealed record Station3Consult(int FormID, int PatientID, DateTime FormDate);

    /// <summary>A lab or medication charged on a visit; ItemType is a ChargeItemType.</summary>
    public sealed record Station3Charge(int FormID, string ItemType, string Name);

    /// <summary>
    /// A past-medical-history row. ConditionName is the catalog entry's name
    /// (null without one); ConditionOther is the physician's free text, which
    /// is what Station 3 writes today.
    /// </summary>
    public sealed record Station3History(int FormID, string? ConditionName, string? ConditionOther, string? MaintenanceDrug);

    public sealed record Station3Social(int FormID, bool? Smokes, bool SmokesCigarette, bool SmokesEcig, string? DrinkFrequency);

    public sealed record Station3Exercise(int FormID, string? ExerciseType);

    /// <summary>A name and the patients it applies to.</summary>
    public sealed record PatientTally(string Name, int Patients);

    /// <summary>A lab or medication and the consultations that ordered it.</summary>
    public sealed record OrderTally(string Name, int Orders);

    /// <summary>Smokers by what they smoke. Unspecified: smokes, but ticked neither kind.</summary>
    public sealed record SmokingCounts(int NonSmoker, int Cigarette, int Ecig, int Both, int Unspecified);

    /// <summary>
    /// The form's six drinking answers in the page's four bars: Never;
    /// Occasionally or Monthly; Weekly; Several times a week or Daily.
    /// </summary>
    public sealed record AlcoholCounts(int Never, int Occasional, int Weekly, int Frequent);

    /// <summary>Patients who reported any exercise, and the most common activities.</summary>
    public sealed record ExerciseSummary(int Patients, List<PatientTally> Top);

    /// <summary>
    /// GET /api/health-reports/station3, from completed consultations.
    /// Consultations, the two rates, Labs and Medications count consultations;
    /// history and lifestyle count each patient once, from their latest
    /// consultation in the range -- the dashboard's Station 3 rule.
    /// </summary>
    public sealed record Station3HealthReport(
        int Consultations,
        int Patients,
        int WithPrescription,
        int WithLabs,
        List<PatientTally> Conditions,
        List<PatientTally> MaintenanceDrugs,
        SmokingCounts Smoking,
        ExerciseSummary Exercise,
        AlcoholCounts Alcohol,
        List<OrderTally> Labs,
        List<OrderTally> Medications)
    {
        public const int TopItems = 10;
        public const int TopActivities = 5;

        // What gets typed into a free-text box to mean "nothing". The catalog's
        // own "NONE" condition is caught here too.
        private static readonly HashSet<string> Placeholders =
            new(["none", "n/a", "na", "nil", "-"], StringComparer.OrdinalIgnoreCase);

        public static Station3HealthReport Build(
            IReadOnlyCollection<Station3Consult> consults,
            IReadOnlyCollection<Station3Charge> charges,
            IReadOnlyCollection<Station3History> histories,
            IReadOnlyCollection<Station3Social> social,
            IReadOnlyCollection<Station3Exercise> exercises)
        {
            var consultIds = consults.Select(c => c.FormID).ToHashSet();
            var latestIds = ReportQueries.LatestPerPatient(consults, c => c.PatientID, c => c.FormDate, c => c.FormID)
                .Select(c => c.FormID)
                .ToHashSet();

            var ordered = charges.Where(c => consultIds.Contains(c.FormID)).ToList();
            var meds = ordered.Where(c => c.ItemType == ChargeItemType.Medication).ToList();
            var labs = ordered.Where(c => c.ItemType == ChargeItemType.Lab).ToList();

            var latestHistory = histories.Where(h => latestIds.Contains(h.FormID)).ToList();
            // One social history per visit; a second row would be a duplicate save.
            var latestSocial = social
                .Where(s => latestIds.Contains(s.FormID))
                .GroupBy(s => s.FormID)
                .Select(g => g.First())
                .ToList();
            var activities = Rank(
                exercises.Where(e => latestIds.Contains(e.FormID)).Select(e => (e.FormID, e.ExerciseType)),
                int.MaxValue);

            return new Station3HealthReport(
                Consultations: consults.Count,
                Patients: latestIds.Count,
                WithPrescription: meds.Select(c => c.FormID).Distinct().Count(),
                WithLabs: labs.Select(c => c.FormID).Distinct().Count(),
                Conditions: Rank(
                        latestHistory.Select(h => (h.FormID,
                            string.IsNullOrWhiteSpace(h.ConditionOther) ? h.ConditionName : h.ConditionOther)),
                        TopItems)
                    .Select(t => new PatientTally(t.Name, t.Count)).ToList(),
                MaintenanceDrugs: Rank(latestHistory.Select(h => (h.FormID, h.MaintenanceDrug)), TopItems)
                    .Select(t => new PatientTally(t.Name, t.Count)).ToList(),
                Smoking: CountSmoking(latestSocial),
                Exercise: new ExerciseSummary(
                    exercises.Where(e => latestIds.Contains(e.FormID) && Clean(e.ExerciseType) != null)
                        .Select(e => e.FormID).Distinct().Count(),
                    activities.Take(TopActivities).Select(t => new PatientTally(t.Name, t.Count)).ToList()),
                Alcohol: CountAlcohol(latestSocial),
                Labs: Rank(labs.Select(c => (c.FormID, (string?)c.Name)), TopItems)
                    .Select(t => new OrderTally(t.Name, t.Count)).ToList(),
                Medications: Rank(meds.Select(c => (c.FormID, (string?)c.Name)), TopItems)
                    .Select(t => new OrderTally(t.Name, t.Count)).ToList());
        }

        private static SmokingCounts CountSmoking(List<Station3Social> social)
        {
            var smokers = social.Where(s => s.Smokes == true).ToList();
            return new SmokingCounts(
                NonSmoker: social.Count(s => s.Smokes == false),
                Cigarette: smokers.Count(s => s.SmokesCigarette && !s.SmokesEcig),
                Ecig: smokers.Count(s => s.SmokesEcig && !s.SmokesCigarette),
                Both: smokers.Count(s => s.SmokesCigarette && s.SmokesEcig),
                Unspecified: smokers.Count(s => !s.SmokesCigarette && !s.SmokesEcig));
        }

        // DRINK_FREQUENCY in features/station3/SocialHistorySection.jsx.
        private static AlcoholCounts CountAlcohol(List<Station3Social> social)
        {
            var answers = social.Select(s => s.DrinkFrequency?.Trim().ToLowerInvariant()).ToList();
            return new AlcoholCounts(
                Never: answers.Count(a => a == "never"),
                Occasional: answers.Count(a => a is "occasionally" or "monthly"),
                Weekly: answers.Count(a => a == "weekly"),
                Frequent: answers.Count(a => a is "several times a week" or "daily"));
        }

        // Distinct visits per name, most first then alphabetical. Spellings that
        // differ only in case or spacing are one name, shown in its most common
        // spelling; blanks and placeholders are left out.
        private static List<(string Name, int Count)> Rank(IEnumerable<(int FormID, string? Name)> rows, int take) =>
            rows.Select(r => (r.FormID, Name: Clean(r.Name)))
                .Where(r => r.Name != null && !Placeholders.Contains(r.Name))
                .GroupBy(r => r.Name!, StringComparer.OrdinalIgnoreCase)
                .Select(g => (
                    Name: g.GroupBy(r => r.Name!, StringComparer.Ordinal)
                        .OrderByDescending(s => s.Count())
                        .ThenBy(s => s.Key, StringComparer.Ordinal)
                        .First().Key,
                    Count: g.Select(r => r.FormID).Distinct().Count()))
                .OrderByDescending(t => t.Count)
                .ThenBy(t => t.Name, StringComparer.OrdinalIgnoreCase)
                .Take(take)
                .ToList();

        private static string? Clean(string? text) =>
            string.IsNullOrWhiteSpace(text) ? null : Regex.Replace(text.Trim(), @"\s+", " ");
    }
}

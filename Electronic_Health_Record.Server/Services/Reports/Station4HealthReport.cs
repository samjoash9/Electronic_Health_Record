namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>One dental screening's answers, as stored (null = left unanswered).</summary>
    public sealed record Station4Exam(
        int FormID, int PatientID, DateTime FormDate,
        string? OralHygiene, string? Caries, string? Gum, string? TreatmentNeed);

    /// <summary>
    /// GET /api/health-reports/station4. Screenings counts visits with a dental
    /// assessment; each tally counts patients once, from their latest one, by
    /// the option they were given. An unanswered question is in no tally.
    /// </summary>
    public sealed record Station4HealthReport(
        int Screenings,
        int Patients,
        Dictionary<string, int> Hygiene,
        Dictionary<string, int> Gum,
        Dictionary<string, int> Caries,
        Dictionary<string, int> TreatmentNeed)
    {
        // DENTAL_INDICATORS in src/lib/constants.js (and the
        // CK_DentalAssessment_* constraints): stored option -> response key.
        private static readonly Dictionary<string, string> HygieneKeys = new()
        {
            ["Good"] = "good", ["Fair"] = "fair", ["Poor"] = "poor",
        };
        private static readonly Dictionary<string, string> GumKeys = new()
        {
            ["Healthy"] = "healthy", ["Gingivitis"] = "gingivitis", ["Suspected Periodontal Problem"] = "periodontal",
        };
        private static readonly Dictionary<string, string> CariesKeys = new()
        {
            ["None"] = "none", ["Present"] = "present",
        };
        private static readonly Dictionary<string, string> TreatmentKeys = new()
        {
            ["None"] = "none", ["Preventive Care"] = "preventive", ["Restorative Treatment"] = "restorative",
            ["Extraction"] = "extraction", ["Other"] = "other",
        };

        public static Station4HealthReport Build(IReadOnlyCollection<Station4Exam> exams)
        {
            var latest = ReportQueries.LatestPerPatient(exams, e => e.PatientID, e => e.FormDate, e => e.FormID);

            return new Station4HealthReport(
                exams.Count,
                latest.Count,
                Count(latest.Select(e => e.OralHygiene), HygieneKeys),
                Count(latest.Select(e => e.Gum), GumKeys),
                Count(latest.Select(e => e.Caries), CariesKeys),
                Count(latest.Select(e => e.TreatmentNeed), TreatmentKeys));
        }

        // Every option present (zero-filled), in the form's order.
        private static Dictionary<string, int> Count(IEnumerable<string?> answers, Dictionary<string, string> keys) =>
            ReportClassifiers.Tally(
                answers.Select(a => a != null && keys.TryGetValue(a, out var key) ? key : null),
                keys.Values.ToArray());
    }
}

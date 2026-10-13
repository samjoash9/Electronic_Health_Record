namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>One vision screening's symptom answers, as stored ("Yes" / "No"; null = left unanswered).</summary>
    public sealed record Station5Exam(
        int FormID, int PatientID, DateTime FormDate,
        string? History, string? EyePain, string? Blurred, string? Near, string? Distant);

    /// <summary>Patients who answered "Yes", out of those who answered at all.</summary>
    public sealed record YesCount(int Yes, int Answered);

    /// <summary>
    /// GET /api/health-reports/station5. Screenings counts visits with a vision
    /// assessment; each symptom counts patients once, from their latest one.
    /// Unanswered is left out of Answered rather than read as "No".
    /// </summary>
    public sealed record Station5HealthReport(
        int Screenings,
        int Patients,
        Dictionary<string, YesCount> Symptoms)
    {
        public static Station5HealthReport Build(IReadOnlyCollection<Station5Exam> exams)
        {
            var latest = ReportQueries.LatestPerPatient(exams, e => e.PatientID, e => e.FormDate, e => e.FormID);

            YesCount Count(Func<Station5Exam, string?> answer) => new(
                latest.Count(e => answer(e) == "Yes"),
                latest.Count(e => !string.IsNullOrWhiteSpace(answer(e))));

            // VISION_INDICATORS' order in src/lib/constants.js.
            return new Station5HealthReport(exams.Count, latest.Count, new Dictionary<string, YesCount>
            {
                ["history"] = Count(e => e.History),
                ["eyePain"] = Count(e => e.EyePain),
                ["blurred"] = Count(e => e.Blurred),
                ["near"] = Count(e => e.Near),
                ["distant"] = Count(e => e.Distant),
            });
        }
    }
}

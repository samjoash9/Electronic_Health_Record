namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>One Station 1 visit, as the Health Reports page aggregates it.</summary>
    public sealed record Station1Visit(
        int FormID, int PatientID, DateTime FormDate, string? Office,
        decimal? Bmi, short? Systolic, short? Diastolic);

    /// <summary>Patients screened from one office. Office is null when the HR record has none.</summary>
    public sealed record OfficeCount(string? Office, int Patients);

    /// <summary>
    /// GET /api/health-reports/station1. Visits counts forms; everything else
    /// counts each patient once, from their latest visit in the range -- the
    /// dashboard's Station 1 rule, so the two agree for the same filter. A
    /// missing reading is left out of its tally, never counted as normal.
    /// </summary>
    public sealed record Station1HealthReport(
        int Visits,
        int Patients,
        Dictionary<string, int> Bmi,
        Dictionary<string, int> Bp,
        List<OfficeCount> ByOffice)
    {
        /// <summary>
        /// visits: every office's visits in the range. office: the filter, or
        /// null for every office. ByOffice ignores the filter -- it is the
        /// comparison the filter cannot give -- and the rest is limited to it.
        /// </summary>
        public static Station1HealthReport Build(IReadOnlyCollection<Station1Visit> visits, string? office)
        {
            var scoped = office == null
                ? visits.ToList()
                : visits.Where(v => SameOffice(v.Office, office)).ToList();

            var latest = ReportQueries.LatestPerPatient(scoped, v => v.PatientID, v => v.FormDate, v => v.FormID);

            return new Station1HealthReport(
                Visits: scoped.Count,
                Patients: latest.Count,
                Bmi: ReportClassifiers.Tally(
                    latest.Select(v => ReportClassifiers.BmiClassDetailed(v.Bmi)),
                    "underweight", "normal", "overweight", "obese1", "obese2"),
                Bp: ReportClassifiers.Tally(
                    latest.Select(v => ReportClassifiers.BpClass(v.Systolic, v.Diastolic)),
                    "normal", "elevated", "stage1", "stage2", "crisis"),
                ByOffice: CountByOffice(visits));
        }

        // As SQL Server compares Patient.AgencyOffice in FormsInRange:
        // case-insensitive, surrounding spaces ignored.
        private static bool SameOffice(string? office, string filter) =>
            string.Equals(office?.Trim(), filter.Trim(), StringComparison.OrdinalIgnoreCase);

        // Distinct patients per office, most first, then by name, with no
        // office on record after the named ones it ties with. Spelling
        // variants of one office (case, stray spaces) count as that office.
        private static List<OfficeCount> CountByOffice(IEnumerable<Station1Visit> visits) =>
            visits.GroupBy(v => v.PatientID)
                  .Select(g => NormaliseOffice(g.First().Office))
                  .GroupBy(o => o, StringComparer.OrdinalIgnoreCase)
                  .Select(g => new OfficeCount(g.Key, g.Count()))
                  .OrderByDescending(o => o.Patients)
                  .ThenBy(o => o.Office == null)
                  .ThenBy(o => o.Office, StringComparer.OrdinalIgnoreCase)
                  .ToList();

        private static string? NormaliseOffice(string? office) =>
            string.IsNullOrWhiteSpace(office) ? null : office.Trim();
    }
}

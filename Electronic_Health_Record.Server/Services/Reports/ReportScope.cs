using System.Globalization;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;

namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>
    /// The filter every report endpoint takes: From and To are inclusive
    /// bounds on FormDate (a Manila calendar date, stored as SQL date), and
    /// Office matches Patient.AgencyOffice, null meaning every office.
    /// </summary>
    public sealed record ReportRange(DateTime From, DateTime To, string? Office)
    {
        /// <summary>
        /// Reads the from / to / office query parameters. from and to are
        /// required as yyyy-MM-dd and from must not be after to; a blank
        /// office means every office. On failure, error is the 400 message.
        /// </summary>
        public static bool TryParse(
            string? from, string? to, string? office, out ReportRange range, out string error)
        {
            range = null!;
            if (!TryParseDate(from, out var fromDate) || !TryParseDate(to, out var toDate))
            {
                error = "from and to are required as yyyy-MM-dd.";
                return false;
            }
            if (fromDate > toDate)
            {
                error = "from must not be after to.";
                return false;
            }

            error = string.Empty;
            range = new ReportRange(fromDate, toDate, string.IsNullOrWhiteSpace(office) ? null : office.Trim());
            return true;
        }

        private static bool TryParseDate(string? value, out DateTime date) =>
            DateTime.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out date);
    }

    /// <summary>The queries and row rules the report controllers share.</summary>
    public static class ReportQueries
    {
        // Non-cancelled visits dated inside the range, limited to the office when one is given.
        public static IQueryable<WellnessForm> FormsInRange(
            this ElectronicHealthRecordDbContext db, ReportRange range) =>
            from f in db.WellnessForms
            join p in db.Patients on f.PatientID equals p.PatientID
            where f.Status != "Cancelled"
               && f.FormDate >= range.From
               && f.FormDate <= range.To
               && (range.Office == null || p.AgencyOffice == range.Office)
            select f;

        // One row per patient: their latest visit, FormID breaking same-day ties.
        public static List<T> LatestPerPatient<T>(
            IEnumerable<T> rows, Func<T, int> patientId, Func<T, DateTime> formDate, Func<T, int> formId) =>
            rows.GroupBy(patientId)
                .Select(g => g.OrderByDescending(formDate).ThenByDescending(formId).First())
                .ToList();
    }
}

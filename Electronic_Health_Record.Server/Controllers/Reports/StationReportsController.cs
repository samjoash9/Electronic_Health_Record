using System.Globalization;
using System.Linq.Expressions;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Electronic_Health_Record.Server.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reports
{
    /// <summary>
    /// The dashboard's per-station report cards. Every action takes the same
    /// filter: from and to are inclusive yyyy-MM-dd bounds on FormDate (a
    /// Manila calendar date), office matches Patient.AgencyOffice and is
    /// omitted for every office. Cancelled visits are left out everywhere.
    ///
    /// Health breakdowns count each patient once, from their latest visit in
    /// the range that has that station's data -- the rule the older dashboard
    /// charts used. Throughput ("completed") counts forms.
    ///
    /// Admin roles only: plain [Authorize] would let a patient or physician
    /// session read clinic-wide aggregates.
    /// </summary>
    [ApiController]
    [Route("api/reports")]
    [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
    public class StationReportsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public StationReportsController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // GET /api/reports/station1?from=&to=&office=
        // Every form is created at Station 1, so every visit in range counts.
        [HttpGet("station1")]
        public async Task<IActionResult> GetStation1(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!TryParseRange(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var visits = await FormsInRange(range)
                .Select(f => new
                {
                    f.FormID, f.PatientID, f.FormDate,
                    f.BMI, f.BPSystolic, f.BPDiastolic, f.TempCelsius, f.HeartRate, f.RespRate,
                })
                .ToListAsync();

            var latest = LatestPerPatient(visits, v => v.PatientID, v => v.FormDate, v => v.FormID);

            return Ok(new
            {
                completed = visits.Count,
                patients = latest.Count,
                bmi = ReportClassifiers.Tally(
                    latest.Select(v => ReportClassifiers.BmiClass(v.BMI)),
                    "underweight", "normal", "overweight", "obese"),
                bp = ReportClassifiers.Tally(
                    latest.Select(v => ReportClassifiers.BpClass(v.BPSystolic, v.BPDiastolic)),
                    "normal", "elevated", "stage1", "stage2", "crisis"),
                flags = new
                {
                    fever = latest.Count(v => ReportClassifiers.IsFever(v.TempCelsius)),
                    tachycardia = latest.Count(v => ReportClassifiers.IsTachycardia(v.HeartRate)),
                    bradycardia = latest.Count(v => ReportClassifiers.IsBradycardia(v.HeartRate)),
                    tachypnea = latest.Count(v => ReportClassifiers.IsTachypnea(v.RespRate)),
                },
            });
        }

        // ---- shared helpers ------------------------------------------------

        private sealed record ReportRange(DateTime From, DateTime To, string? Office);

        // Set from a projection so EF can translate it; see ThroughputAsync.
        private sealed class StationSpan
        {
            public DateTime? Start { get; init; }
            public DateTime? End { get; init; }
        }

        private static bool TryParseRange(
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

        // Non-cancelled visits dated inside the range, limited to the office when one is given.
        private IQueryable<WellnessForm> FormsInRange(ReportRange range) =>
            from f in _context.WellnessForms
            join p in _context.Patients on f.PatientID equals p.PatientID
            where f.Status != "Cancelled"
               && f.FormDate >= range.From
               && f.FormDate <= range.To
               && (range.Office == null || p.AgencyOffice == range.Office)
            select f;

        // One row per patient: their latest visit, FormID breaking same-day ties.
        private static List<T> LatestPerPatient<T>(
            IEnumerable<T> rows, Func<T, int> patientId, Func<T, DateTime> formDate, Func<T, int> formId) =>
            rows.GroupBy(patientId)
                .Select(g => g.OrderByDescending(formDate).ThenByDescending(formId).First())
                .ToList();

        // Forms in range that finished the station, and the median minutes spent at it.
        // The finished filter runs in memory: two columns per visit is cheap,
        // and EF cannot filter on a member of an object it just constructed.
        private async Task<(int Completed, double? MedianMinutes)> ThroughputAsync(
            ReportRange range, Expression<Func<WellnessForm, StationSpan>> span)
        {
            var spans = await FormsInRange(range).Select(span).ToListAsync();
            var finished = spans.Where(s => s.End != null).ToList();
            return (finished.Count, ReportClassifiers.MedianMinutes(finished.Select(s => (s.Start, s.End))));
        }
    }
}

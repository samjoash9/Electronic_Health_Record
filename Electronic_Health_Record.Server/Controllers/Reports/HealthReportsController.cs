using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reports
{
    /// <summary>
    /// The Health Reports page, one action per station section. Takes the
    /// same from / to / office filter as StationReportsController (see
    /// ReportRange) and excludes cancelled visits the same way.
    ///
    /// Staff policy, not the dashboard's admin roles: the page is open to
    /// physicians as much as admins (see the /health-reports route), but
    /// never to a patient -- these are clinic-wide figures.
    /// </summary>
    [ApiController]
    [Route("api/health-reports")]
    [Authorize(Policy = AuthPolicies.Staff)]
    public class HealthReportsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public HealthReportsController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // GET /api/health-reports/station1?from=&to=&office=
        // Loads every office's visits in the range in one query, because the
        // by-office chart compares all of them whatever the office filter;
        // Station1HealthReport.Build applies the filter to everything else.
        [HttpGet("station1")]
        public async Task<IActionResult> GetStation1(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!ReportRange.TryParse(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var visits = await (
                from f in _context.FormsInRange(range with { Office = null })
                join p in _context.Patients on f.PatientID equals p.PatientID
                select new Station1Visit(
                    f.FormID, f.PatientID, f.FormDate, p.AgencyOffice,
                    f.BMI, f.BPSystolic, f.BPDiastolic)
            ).ToListAsync();

            return Ok(Station1HealthReport.Build(visits, range.Office));
        }
    }
}

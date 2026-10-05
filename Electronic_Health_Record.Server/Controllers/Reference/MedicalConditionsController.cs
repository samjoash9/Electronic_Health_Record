using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reference
{
    [ApiController]
    [Route("api/[controller]")]
    // Reference data, not patient data: every signed-in role needs it to render
    // the history forms, but it is not public.
    [Authorize]
    public class MedicalConditionsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public MedicalConditionsController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // GET /api/medicalconditions
        [HttpGet("")]
        public async Task<IActionResult> GetConditions()
        {
            var conditions = await _context.MedicalConditions
                .OrderBy(c => c.ConditionID)
                .ToListAsync();
            return Ok(conditions);
        }

        // GET /api/medicalconditions/diagnosed?granularity=day&year=2026&month=10&day=5
        // GET /api/medicalconditions/diagnosed?granularity=month&year=2026&month=10
        // GET /api/medicalconditions/diagnosed?granularity=year&year=2026
        // The dashboard's "Diagnosed Conditions" donut: for visits whose
        // FormDate falls in one day / month / year, how many distinct patients
        // reported each condition in their Past Medical History (Station 3).
        // A patient seen twice in the period counts once per condition.
        // Cancelled forms and the catalog's "NONE" entry are left out, and
        // free-text conditions are pooled under one "Others" entry (null
        // conditionID), listed last. FormDate is already the clinic's
        // calendar date, so unlike Patient.CreatedAt it needs no UTC shift.
        [HttpGet("diagnosed")]
        public async Task<IActionResult> GetDiagnosed(
            [FromQuery] string? granularity,
            [FromQuery] int? year,
            [FromQuery] int? month,
            [FromQuery] int? day)
        {
            var mode = granularity?.Trim().ToLowerInvariant();
            if (mode is not ("day" or "month" or "year"))
                return BadRequest(new { message = "granularity must be day, month, or year." });

            if (year is not (>= 1900 and <= 2100))
                return BadRequest(new { message = "A year between 1900 and 2100 is required." });

            if (mode is "day" or "month" && month is not (>= 1 and <= 12))
                return BadRequest(new { message = "A month between 1 and 12 is required." });

            if (mode == "day" && (day is not { } d || d < 1 || d > DateTime.DaysInMonth(year.Value, month!.Value)))
                return BadRequest(new { message = "That day does not exist in the chosen month." });

            var start = mode switch
            {
                "day" => new DateTime(year.Value, month!.Value, day!.Value),
                "month" => new DateTime(year.Value, month!.Value, 1),
                _ => new DateTime(year.Value, 1, 1),
            };
            var end = mode switch
            {
                "day" => start.AddDays(1),
                "month" => start.AddMonths(1),
                _ => start.AddYears(1),
            };

            var noneIds = await _context.MedicalConditions
                .Where(c => c.ConditionName == "NONE")
                .Select(c => c.ConditionID)
                .ToListAsync();

            // One row per (patient, condition) reported in the period. A
            // history row with no condition at all (only a maintenance drug,
            // say) names nothing to count, so it is dropped.
            var patientConditions = (
                from h in _context.PastMedicalHistories
                join f in _context.WellnessForms on h.FormID equals f.FormID
                where f.FormDate >= start && f.FormDate < end && f.Status != "Cancelled"
                where (h.ConditionID != null && !noneIds.Contains(h.ConditionID.Value))
                   || (h.ConditionID == null && h.ConditionOther != null && h.ConditionOther.Trim() != "")
                select new { f.PatientID, h.ConditionID }
            ).Distinct();

            var counts = await patientConditions
                .GroupBy(r => r.ConditionID)
                .Select(g => new { ConditionID = g.Key, Count = g.Count() })
                .ToListAsync();

            var total = await patientConditions
                .Select(r => r.PatientID)
                .Distinct()
                .CountAsync();

            var countedIds = counts.Where(c => c.ConditionID != null).Select(c => c.ConditionID!.Value).ToList();
            var names = await _context.MedicalConditions
                .Where(c => countedIds.Contains(c.ConditionID))
                .ToDictionaryAsync(c => c.ConditionID, c => c.ConditionName);

            var conditions = counts
                .OrderBy(c => c.ConditionID == null) // Others last
                .ThenByDescending(c => c.Count)
                .ThenBy(c => c.ConditionID)
                .Select(c => new
                {
                    c.ConditionID,
                    Name = c.ConditionID is { } id ? names.GetValueOrDefault(id, $"Condition #{id}") : "Others",
                    c.Count,
                })
                .ToList();

            // What the Year dropdown offers: every year with a visit, through
            // this year.
            var thisYear = PhilippineTime.Today.Year;
            var firstFormDate = await _context.WellnessForms.MinAsync(f => (DateTime?)f.FormDate);
            var firstYear = firstFormDate is { } first ? Math.Min(first.Year, thisYear) : thisYear;

            return Ok(new
            {
                Total = total,
                Conditions = conditions,
                Years = Enumerable.Range(firstYear, thisYear - firstYear + 1).ToList(),
            });
        }
    }
}

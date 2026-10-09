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

        // GET /api/health-reports/station2?from=&to=&office=
        // Picks each patient's latest assessed visit as the dashboard's
        // Station 2 does, so the two agree on patients and on the weakest
        // aspect; Station2HealthReport.Build scores what they answered.
        [HttpGet("station2")]
        public async Task<IActionResult> GetStation2(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!ReportRange.TryParse(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var assessed = await _context.FormsInRange(range)
                .Where(f => _context.AssessmentAnswers.Any(a => a.FormID == f.FormID))
                .Select(f => new { f.FormID, f.PatientID, f.FormDate })
                .ToListAsync();
            var latestIds = ReportQueries.LatestPerPatient(assessed, v => v.PatientID, v => v.FormDate, v => v.FormID)
                .Select(v => v.FormID)
                .ToList();

            var answers = await (
                from a in _context.AssessmentAnswers
                join o in _context.AssessmentOptions on a.OptionID equals o.OptionID
                join q in _context.AssessmentQuestions on a.QuestionID equals q.QuestionID
                where latestIds.Contains(a.FormID)
                select new Station2Answer(a.FormID, a.QuestionID, q.CategoryID, (int)o.Score)
            ).ToListAsync();

            // A question's best option is what an answer to it could have scored.
            var bestByQuestion = await _context.AssessmentOptions
                .GroupBy(o => o.QuestionID)
                .Select(g => new { QuestionID = g.Key, Best = g.Max(o => (int)o.Score) })
                .ToDictionaryAsync(q => q.QuestionID, q => q.Best);

            var categories = await _context.AssessmentCategories.ToListAsync();

            return Ok(Station2HealthReport.Build(assessed.Count, answers, bestByQuestion, categories));
        }

        // GET /api/health-reports/station3?from=&to=&office=
        // Completed consultations only. History and lifestyle are loaded for
        // each patient's latest one, as the dashboard's Station 3 does;
        // Station3HealthReport.Build does the counting.
        [HttpGet("station3")]
        public async Task<IActionResult> GetStation3(
            [FromQuery] string? from, [FromQuery] string? to, [FromQuery] string? office)
        {
            if (!ReportRange.TryParse(from, to, office, out var range, out var error))
                return BadRequest(new { message = error });

            var completed = _context.FormsInRange(range).Where(f => f.Station3SubmittedAt != null);

            var consults = await completed
                .Select(f => new Station3Consult(f.FormID, f.PatientID, f.FormDate))
                .ToListAsync();
            var latestIds = ReportQueries.LatestPerPatient(consults, c => c.PatientID, c => c.FormDate, c => c.FormID)
                .Select(c => c.FormID)
                .ToList();

            var charges = await (
                from c in _context.WellnessFormCharges
                join f in completed on c.FormID equals f.FormID
                select new Station3Charge(c.FormID, c.ItemType, c.Name)
            ).ToListAsync();

            var histories = await (
                from h in _context.PastMedicalHistories
                join m in _context.MedicalConditions on h.ConditionID equals (int?)m.ConditionID into catalog
                from m in catalog.DefaultIfEmpty()
                where latestIds.Contains(h.FormID)
                select new Station3History(
                    h.FormID, m == null ? null : m.ConditionName, h.ConditionOther, h.MaintenanceDrugGeneric)
            ).ToListAsync();

            var social = await _context.SocialHistories
                .Where(s => latestIds.Contains(s.FormID))
                .Select(s => new Station3Social(s.FormID, s.Smokes, s.SmokesCigarette, s.SmokesEcig, s.DrinkFrequency))
                .ToListAsync();

            var exercises = await _context.Exercises
                .Where(e => latestIds.Contains(e.FormID))
                .Select(e => new Station3Exercise(e.FormID, e.ExerciseType))
                .ToListAsync();

            return Ok(Station3HealthReport.Build(consults, charges, histories, social, exercises));
        }
    }
}

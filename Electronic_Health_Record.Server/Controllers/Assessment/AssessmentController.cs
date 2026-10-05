using Electronic_Health_Record.Server.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Assessment
{
    [ApiController]
    [Route("api/[controller]")]
    // The template is clinical configuration rather than patient data, so any
    // signed-in account may read it -- but it still describes the questionnaire
    // this clinic runs and has no reason to be readable anonymously.
    [Authorize]
    public class AssessmentController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public AssessmentController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // GET /api/assessment/template
        // Categories -> questions -> options, matching getAssessmentTemplate in
        // src/api/assessment.api.js: inactive questions dropped, all three levels
        // sorted by DisplayOrder. Category "name" (not "categoryName") is read by
        // CATEGORY_STYLES on the client, so the field name here is load-bearing.
        [HttpGet("template")]
        public async Task<IActionResult> GetTemplate()
        {
            var categories = await _context.AssessmentCategories
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            var questions = await _context.AssessmentQuestions
                .Where(q => q.IsActive)
                .OrderBy(q => q.DisplayOrder)
                .ToListAsync();

            var options = await _context.AssessmentOptions
                .OrderBy(o => o.DisplayOrder)
                .ToListAsync();

            var optionsByQuestion = options.ToLookup(o => o.QuestionID);
            var questionsByCategory = questions.ToLookup(q => q.CategoryID);

            var template = categories.Select(category => new
            {
                category.CategoryID,
                category.Name,
                category.DisplayOrder,
                Questions = questionsByCategory[category.CategoryID].Select(question => new
                {
                    question.QuestionID,
                    question.QuestionText,
                    question.DisplayOrder,
                    question.IsActive,
                    Options = optionsByQuestion[question.QuestionID].Select(option => new
                    {
                        option.OptionID,
                        option.QuestionID,
                        option.OptionText,
                        option.Score,
                        option.DisplayOrder,
                    }),
                }),
            });

            return Ok(template);
        }

        // GET /api/assessment/wellness-scores
        // GET /api/assessment/wellness-scores?office=PROVINCIAL HEALTH OFFICE
        // The dashboard's "7 Aspects of Wellness" chart: the average Station 2
        // score of each category, as a percentage of the points possible.
        // Each patient counts once, by their latest non-cancelled visit that
        // has any answers -- so the chart shows where people stand now, and a
        // frequent visitor does not outweigh everyone else.
        // A category's score is the points scored over the points its
        // answered questions could have scored (each question's best option),
        // pooled across patients. Unanswered questions are left out rather
        // than counted as zero, and answers to since-retired questions still
        // count. Every category comes back, in DisplayOrder; one nobody has
        // answered has a null score.
        // office is compared with Patient.AgencyOffice, as in
        // PatientsController.GetSmokingStatus. Omit it for every office.
        [HttpGet("wellness-scores")]
        public async Task<IActionResult> GetWellnessScores([FromQuery] string? office)
        {
            var officeFilter = string.IsNullOrWhiteSpace(office) ? null : office.Trim();

            var assessed =
                from f in _context.WellnessForms
                join p in _context.Patients on f.PatientID equals p.PatientID
                where f.Status != "Cancelled"
                   && (officeFilter == null || p.AgencyOffice == officeFilter)
                   && _context.AssessmentAnswers.Any(a => a.FormID == f.FormID)
                select new { f.FormID, f.PatientID, f.FormDate };

            // A patient's latest assessed visit is the one no other assessed
            // visit of theirs comes after; FormID breaks same-day ties, so
            // there is exactly one per patient.
            var latestFormIds = assessed
                .Where(a => !assessed.Any(b =>
                    b.PatientID == a.PatientID
                    && (b.FormDate > a.FormDate
                        || (b.FormDate == a.FormDate && b.FormID > a.FormID))))
                .Select(a => a.FormID);

            var patientCount = await latestFormIds.CountAsync();

            var perQuestion = await (
                from a in _context.AssessmentAnswers
                join o in _context.AssessmentOptions on a.OptionID equals o.OptionID
                where latestFormIds.Contains(a.FormID)
                group o by a.QuestionID into g
                select new { QuestionID = g.Key, Points = g.Sum(o => (int)o.Score), Answers = g.Count() }
            ).ToListAsync();

            // Both lookups are a few dozen rows, so the points possible are
            // worked out here rather than in SQL.
            var bestScoreByQuestion = await _context.AssessmentOptions
                .GroupBy(o => o.QuestionID)
                .Select(g => new { QuestionID = g.Key, Best = g.Max(o => (int)o.Score) })
                .ToDictionaryAsync(q => q.QuestionID, q => q.Best);

            var categoryByQuestion = await _context.AssessmentQuestions
                .ToDictionaryAsync(q => q.QuestionID, q => q.CategoryID);

            var totalsByCategory = perQuestion
                .GroupBy(q => categoryByQuestion[q.QuestionID])
                .ToDictionary(g => g.Key, g => new
                {
                    Points = g.Sum(q => q.Points),
                    Possible = g.Sum(q => q.Answers * bestScoreByQuestion.GetValueOrDefault(q.QuestionID)),
                });

            var categories = await _context.AssessmentCategories
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            var aspects = categories.Select(c => new
            {
                c.CategoryID,
                c.Name,
                Score = totalsByCategory.TryGetValue(c.CategoryID, out var t) && t.Possible > 0
                    ? Math.Round(t.Points * 100.0 / t.Possible, 1)
                    : (double?)null,
            });

            return Ok(new
            {
                Total = patientCount,
                Aspects = aspects,
            });
        }
    }
}

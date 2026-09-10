using Electronic_Health_Record.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Assessment
{
    [ApiController]
    [Route("api/[controller]")]
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
    }
}

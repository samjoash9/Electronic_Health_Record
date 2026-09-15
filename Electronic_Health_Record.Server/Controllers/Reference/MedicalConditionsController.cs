using Electronic_Health_Record.Server.Data;
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
    }
}

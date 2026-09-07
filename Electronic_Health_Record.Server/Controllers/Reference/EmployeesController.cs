using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Electronic_Health_Record.Server.Controllers.Reference
{
    // Station 1's employee picker. Backed by IEmployeeDirectory so the seeded
    // implementation swaps for a real HR API client without touching this file.
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeDirectory _directory;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(IEmployeeDirectory directory, ILogger<EmployeesController> logger)
        {
            _directory = directory;
            _logger = logger;
        }

        // GET /api/employees?q=<query>
        // Empty/omitted q returns every employee -- the client has no server-side
        // paging for this endpoint (see searchEmployees in src/api/patients.api.js),
        // it slices the full result client-side.
        [HttpGet("")]
        public async Task<IActionResult> Search([FromQuery] string? q)
        {
            var employees = await _directory.SearchAsync(q);
            return Ok(employees);
        }
    }
}

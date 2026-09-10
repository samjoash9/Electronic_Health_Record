using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Electronic_Health_Record.Server.Controllers.Reference
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(
            IEmployeeService employeeService,
            ILogger<EmployeesController> logger)
        {
            _employeeService = employeeService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetEmployees()
        {
            try
            {
                var employees = await _employeeService.GetLocalEmployeesAsync();
                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while retrieving employees.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "An unexpected error occurred." });
            }
        }

        [HttpGet("{externalEmployeeId}")]
        public async Task<IActionResult> GetEmployeeById(string externalEmployeeId)
        {
            if (string.IsNullOrWhiteSpace(externalEmployeeId))
            {
                return BadRequest(new { message = "Employee ID is required." });
            }

            try
            {
                var employee = await _employeeService.GetLocalEmployeeByIdAsync(externalEmployeeId);

                if (employee == null)
                {
                    return NotFound(new { message = "Employee not found." });
                }

                return Ok(employee);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Unexpected error while retrieving employee {ExternalEmployeeId}.",
                    externalEmployeeId);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "An unexpected error occurred." });
            }
        }
    }
}
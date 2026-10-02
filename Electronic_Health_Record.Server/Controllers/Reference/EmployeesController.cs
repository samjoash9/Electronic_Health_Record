
using Electronic_Health_Record.Server.DTOs.Employee;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reference
{
    // The employee directory is personal data (names, birthdates, addresses),
    // so reads require a signed-in account and writes an admin.
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;
        private readonly IEmployeeDirectory _directory;
        private readonly ILogger<EmployeesController> _logger;

        public EmployeesController(
            IEmployeeService employeeService,
            IEmployeeDirectory directory,
            ILogger<EmployeesController> logger)
        {
            _employeeService = employeeService;
            _directory = directory;
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
                _logger.LogError(
                    ex,
                    "Unexpected error while retrieving employees.");

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
                return BadRequest(
                    new { message = "Employee ID is required." });
            }

            try
            {
                var employee =
                    await _employeeService.GetLocalEmployeeByIdAsync(
                        externalEmployeeId);

                if (employee == null)
                {
                    return NotFound(
                        new { message = "Employee not found." });
                }

                return Ok(employee);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while retrieving employee {ExternalEmployeeId}.",
                    externalEmployeeId);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "An unexpected error occurred." });
            }
        }

        // GET /api/employees/search?q=
        // Directory search backing the Onboarding page's employee picker.
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? q)
        {
            try
            {
                var employees = await _directory.SearchAsync(q);

                return Ok(employees);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while searching the employee directory.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "An unexpected error occurred." });
            }
        }

        // POST /api/employees
        // Adds an employee who has not been synced from the HR feed yet.
        // ExternalEmployeeId is generated automatically by the server.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpPost("")]
        public async Task<IActionResult> Create(
            [FromBody] UpsertEmployeeDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                // Generate the next External Employee ID.
                var externalId = await GenerateExternalEmployeeIdAsync();

                var employee = new Models.Employee
                {
                    IsLocallyAdded = true,
                    ExternalEmployeeId = externalId
                };

                Apply(dto, employee);

                var created = await _directory.AddAsync(employee);

                return CreatedAtAction(
                    nameof(Search),
                    new { q = created.ExternalEmployeeId },
                    created);
            }
            catch (NotSupportedException)
            {
                // A read-only HR directory implementation.
                _logger.LogWarning(
                    "The configured employee directory does not accept writes.");

                return StatusCode(
                    StatusCodes.Status501NotImplemented,
                    "This employee directory is read-only.");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while creating an employee.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "An unexpected error occurred." });
            }
        }

        // PUT /api/employees/{externalEmployeeId}
        // The existing ExternalEmployeeId is used to identify the employee.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpPut("{externalEmployeeId}")]
        public async Task<IActionResult> Update(
            string externalEmployeeId,
            [FromBody] UpsertEmployeeDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (string.IsNullOrWhiteSpace(externalEmployeeId))
            {
                return BadRequest(
                    new { message = "Employee ID is required." });
            }

            var employee =
                await _directory.FindByExternalIdAsync(
                    externalEmployeeId);

            if (employee == null)
            {
                return NotFound(
                    $"Employee {externalEmployeeId} was not found.");
            }

            // Do not allow the Employee ID to be changed during update.
            Apply(dto, employee);

            try
            {
                return Ok(
                    await _directory.UpdateAsync(employee));
            }
            catch (NotSupportedException)
            {
                _logger.LogWarning(
                    "The configured employee directory does not accept writes.");

                return StatusCode(
                    StatusCodes.Status501NotImplemented,
                    "This employee directory is read-only.");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Unexpected error while updating employee {ExternalEmployeeId}.",
                    externalEmployeeId);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new { message = "An unexpected error occurred." });
            }
        }

        // Generates the next ExternalEmployeeId.
        //
        // Example:
        // EMP-0001
        // EMP-0002
        // EMP-0003
        //
        // This checks the existing directory records and finds
        // the highest numeric employee ID before incrementing it.
        private async Task<string> GenerateExternalEmployeeIdAsync()
        {
            var employees = await _directory.SearchAsync(null);

            var highestNumber = 0;

            foreach (var employee in employees)
            {
                if (string.IsNullOrWhiteSpace(employee.ExternalEmployeeId))
                {
                    continue;
                }

                const string prefix = "EMP-";

                if (!employee.ExternalEmployeeId.StartsWith(
                        prefix,
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var numberPart =
                    employee.ExternalEmployeeId
                        .Substring(prefix.Length);

                if (int.TryParse(numberPart, out var number))
                {
                    if (number > highestNumber)
                    {
                        highestNumber = number;
                    }
                }
            }

            var nextNumber = highestNumber + 1;

            return $"EMP-{nextNumber:D4}";
        }

        // IsLocallyAdded is deliberately not copied from the DTO.
        // It records where the employee row came from.
        private static void Apply(
            UpsertEmployeeDto dto,
            Models.Employee employee)
        {
            // ExternalEmployeeId is intentionally NOT assigned here.
            //
            // It is generated by the server during Create()
            // and preserved during Update().

            employee.Surname =
                dto.Surname.Trim();

            employee.FirstName =
                dto.FirstName.Trim();

            employee.MiddleName =
                string.IsNullOrWhiteSpace(dto.MiddleName)
                    ? null
                    : dto.MiddleName.Trim();

            employee.Birthdate =
                dto.Birthdate.Date;

            employee.Sex =
                dto.Sex;

            employee.CivilStatus =
                dto.CivilStatus;

            employee.Address =
                string.IsNullOrWhiteSpace(dto.Address)
                    ? null
                    : dto.Address.Trim();

            employee.AgencyOffice =
                string.IsNullOrWhiteSpace(dto.AgencyOffice)
                    ? null
                    : dto.AgencyOffice.Trim();

            employee.Position =
                string.IsNullOrWhiteSpace(dto.Position)
                    ? null
                    : dto.Position.Trim();

            employee.ContactNo =
                string.IsNullOrWhiteSpace(dto.ContactNo)
                    ? null
                    : dto.ContactNo.Trim();
        }
    }
}


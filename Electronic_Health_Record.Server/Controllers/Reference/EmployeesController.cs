using Electronic_Health_Record.Server.DTOs.Employee;
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

        // POST /api/employees
        // Adds someone the HR feed has not synced yet, from the Onboarding page.
        // Not a sign-in account: a patient account is provisioned at Station 1.
        [HttpPost("")]
        public async Task<IActionResult> Create([FromBody] UpsertEmployeeDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var externalId = dto.ExternalEmployeeId.Trim();
            if (await _directory.FindByExternalIdAsync(externalId) is not null)
                return Conflict($"Employee ID {externalId} already exists in the directory.");

            var employee = new Models.Employee { IsLocallyAdded = true };
            Apply(dto, employee);

            try
            {
                var created = await _directory.AddAsync(employee);
                return CreatedAtAction(nameof(Search), new { q = created.ExternalEmployeeId }, created);
            }
            catch (NotSupportedException)
            {
                // A read-only HR directory implementation. Nothing the caller can fix.
                _logger.LogWarning("The configured employee directory does not accept writes.");
                return StatusCode(501, "This employee directory is read-only.");
            }
        }

        // PUT /api/employees/{externalEmployeeId}
        // Keyed on the HR id rather than the local EmployeeID: that is the handle
        // the Onboarding page and Station 1 both hold.
        [HttpPut("{externalEmployeeId}")]
        public async Task<IActionResult> Update(
            string externalEmployeeId,
            [FromBody] UpsertEmployeeDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var employee = await _directory.FindByExternalIdAsync(externalEmployeeId);
            if (employee == null)
                return NotFound($"Employee {externalEmployeeId} was not found.");

            var nextId = dto.ExternalEmployeeId.Trim();
            if (nextId != externalEmployeeId
                && await _directory.FindByExternalIdAsync(nextId) is not null)
            {
                return Conflict($"Employee ID {nextId} already exists in the directory.");
            }

            Apply(dto, employee);

            try
            {
                return Ok(await _directory.UpdateAsync(employee));
            }
            catch (NotSupportedException)
            {
                _logger.LogWarning("The configured employee directory does not accept writes.");
                return StatusCode(501, "This employee directory is read-only.");
            }
        }

        // IsLocallyAdded is deliberately not copied from the DTO: it records where
        // a row came from, which the client does not get to assert.
        private static void Apply(UpsertEmployeeDto dto, Models.Employee employee)
        {
            employee.ExternalEmployeeId = dto.ExternalEmployeeId.Trim();
            employee.Surname = dto.Surname.Trim();
            employee.FirstName = dto.FirstName.Trim();
            employee.MiddleName = string.IsNullOrWhiteSpace(dto.MiddleName) ? null : dto.MiddleName.Trim();
            employee.Birthdate = dto.Birthdate.Date;
            employee.Sex = dto.Sex;
            employee.CivilStatus = dto.CivilStatus;
            employee.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim();
            employee.AgencyOffice = string.IsNullOrWhiteSpace(dto.AgencyOffice) ? null : dto.AgencyOffice.Trim();
            employee.Position = string.IsNullOrWhiteSpace(dto.Position) ? null : dto.Position.Trim();
            employee.ContactNo = string.IsNullOrWhiteSpace(dto.ContactNo) ? null : dto.ContactNo.Trim();
        }
    }
}
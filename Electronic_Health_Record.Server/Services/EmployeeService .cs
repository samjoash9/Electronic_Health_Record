using System.Net.Http.Json;
using System.Text.Json;

using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Employee;
using Electronic_Health_Record.Server.DTOs.Patient;
using Electronic_Health_Record.Server.Models;

using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Services
{
    // ============================================================
    // Employee Service
    // ============================================================
    // Responsible for:
    // 1. Getting employees from the external Employee API
    //    (called ONLY by the background sync job)
    // 2. Saving/updating employees in the local database
    // 3. Serving local-only reads to the rest of the app,
    //    which never touch the external API
    // ============================================================

    public class EmployeeService : IEmployeeService
    {
        private readonly HttpClient _httpClient;
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<EmployeeService> _logger;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public EmployeeService(
            HttpClient httpClient,
            ElectronicHealthRecordDbContext context,
            ILogger<EmployeeService> logger)
        {
            _httpClient = httpClient;
            _context = context;
            _logger = logger;
        }

        // ========================================================
        // Sync: Get Employees from external HR API, save locally
        // ========================================================

        public async Task<List<EmployeeDto>> GetEmployeesAsync()
        {
            List<EmployeeDto> employees;

            try
            {
                _logger.LogInformation(
                    "Fetching active employees from the Employee API. BaseAddress={BaseAddress}",
                    _httpClient.BaseAddress);

                var response = await _httpClient.GetAsync("");
                var rawContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError(
                        "Employee API returned non-success status {StatusCode}. Body: {Body}",
                        (int)response.StatusCode,
                        Truncate(rawContent, 2000));

                    throw new HttpRequestException(
                        $"Employee API returned status code {(int)response.StatusCode}.");
                }

                try
                {
                    employees = JsonSerializer.Deserialize<List<EmployeeDto>>(
                        rawContent, JsonOptions) ?? new List<EmployeeDto>();
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(
                        jsonEx,
                        "Failed to deserialize Employee API response. Raw body: {Body}",
                        Truncate(rawContent, 2000));

                    throw;
                }

                _logger.LogInformation(
                    "Employee API returned {Count} record(s).",
                    employees.Count);

                if (employees.Count == 0)
                {
                    _logger.LogWarning(
                        "Employee API returned zero records — nothing will be saved.");
                }

                await SaveEmployeesAsync(employees);

                return employees;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to retrieve employees from the Employee API.");
                throw;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Employee API request timed out.");
                throw;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "Employee API response could not be parsed as JSON.");
                throw;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(
                    ex,
                    "HttpClient configuration error while calling the Employee API. " +
                    "Verify that BaseAddress is set correctly in the client registration.");
                throw;
            }
        }

        // ========================================================
        // Save Employees (insert new / update existing)
        // ========================================================

        private async Task SaveEmployeesAsync(List<EmployeeDto> employees)
        {
            if (employees == null || employees.Count == 0)
            {
                _logger.LogWarning("SaveEmployeesAsync called with no employees to save. Skipping.");
                return;
            }

            var savedCount = 0;
            var skippedCount = 0;

            foreach (var dto in employees)
            {
                if (dto.Eid <= 0)
                {
                    skippedCount++;
                    _logger.LogWarning("Skipping employee record with invalid Eid: {@Dto}", dto);
                    continue;
                }

                var externalEmployeeId = dto.Eid.ToString();

                var employee = await _context.Employees
                    .FirstOrDefaultAsync(e => e.ExternalEmployeeId == externalEmployeeId);

                if (employee == null)
                {
                    employee = new Employee { ExternalEmployeeId = externalEmployeeId };
                    _context.Employees.Add(employee);

                    _logger.LogInformation(
                        "New employee detected from HR source: Eid={Eid}, Name={FirstName} {Surname}",
                        dto.Eid, dto.Firstname, dto.Surname);
                }

                employee.Surname = dto.Surname;
                employee.FirstName = dto.Firstname;
                employee.MiddleName = dto.Middlename;
                employee.Birthdate = dto.BirthDate ?? DateTime.MinValue;
                employee.Age = dto.Age ?? 0;
                employee.Sex = dto.Sex;
                employee.CivilStatus = dto.CivilStatus;
                employee.Address = dto.Address;
                employee.AgencyOffice = dto.Office;
                employee.Position = dto.Position;
                employee.ContactNo = dto.ContactNumber;

                savedCount++;
            }

            try
            {
                var changedRows = await _context.SaveChangesAsync();

                _logger.LogInformation(
                    "SaveChangesAsync committed {ChangedRows} row(s). " +
                    "Processed {SavedCount} employee(s), skipped {SkippedCount}.",
                    changedRows, savedCount, skippedCount);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to save employees to the database. Inner exception: {InnerMessage}",
                    ex.InnerException?.Message);
                throw;
            }
        }

        // ========================================================
        // Local reads — used by the rest of the app.
        // These NEVER call the external HR API.
        // ========================================================

        public async Task<List<EmployeeResponseDto>> GetLocalEmployeesAsync()
        {
            var localEmployees = await _context.Employees
                .AsNoTracking()
                .ToListAsync();

            return localEmployees.Select(MapToResponseDto).ToList();
        }

        public async Task<EmployeeResponseDto?> GetLocalEmployeeByIdAsync(string externalEmployeeId)
        {
            var employee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.ExternalEmployeeId == externalEmployeeId);

            return employee == null ? null : MapToResponseDto(employee);
        }

        private static EmployeeResponseDto MapToResponseDto(Employee e) => new()
        {
            ExternalEmployeeId = e.ExternalEmployeeId,
            Surname = e.Surname,
            FirstName = e.FirstName,
            MiddleName = e.MiddleName,
            Birthdate = e.Birthdate,
            Sex = e.Sex,
            CivilStatus = e.CivilStatus,
            Address = e.Address,
            AgencyOffice = e.AgencyOffice,
            Position = e.Position,
            ContactNo = e.ContactNo,
            IsLocallyAdded = e.IsLocallyAdded
        };

        private static string Truncate(string value, int maxLength)
        {
            if (string.IsNullOrEmpty(value) || value.Length <= maxLength)
                return value;

            return value[..maxLength] + "... [truncated]";
        }
    }
}
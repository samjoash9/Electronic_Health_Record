using Electronic_Health_Record.Server.DTOs.Employee;
using Electronic_Health_Record.Server.DTOs.Patient;

namespace Electronic_Health_Record.Server.Services
{
    public interface IEmployeeService
    {
        // Calls the external HR API, saves results locally.
        // Only ever called by the background sync job.
        Task<List<EmployeeDto>> GetEmployeesAsync();

        // Local database only — used by the app's normal read paths.
        Task<List<EmployeeResponseDto>> GetLocalEmployeesAsync();
        Task<EmployeeResponseDto?> GetLocalEmployeeByIdAsync(string externalEmployeeId);
    }
}
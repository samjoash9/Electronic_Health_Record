using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Services
{
    public class SeededEmployeeDirectory : IEmployeeDirectory
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public SeededEmployeeDirectory(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // Mirrors the mock's search: case-insensitive substring over the full name
        // or the employee id. Empty query returns everyone — the client has no
        // server-side paging for this endpoint, it slices client-side.
        public async Task<IReadOnlyList<Employee>> SearchAsync(string? query)
        {
            var employees = _context.Employees.AsQueryable();

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.Trim();
                employees = employees.Where(e =>
                    EF.Functions.Like(e.Surname, $"%{q}%") ||
                    EF.Functions.Like(e.FirstName, $"%{q}%") ||
                    (e.MiddleName != null && EF.Functions.Like(e.MiddleName, $"%{q}%")) ||
                    EF.Functions.Like(e.ExternalEmployeeId, $"%{q}%"));
            }

            return await employees
                .OrderBy(e => e.Surname).ThenBy(e => e.FirstName)
                .ToListAsync();
        }

        public async Task<Employee?> FindByExternalIdAsync(string externalEmployeeId)
        {
            return await _context.Employees
                .FirstOrDefaultAsync(e => e.ExternalEmployeeId == externalEmployeeId);
        }
    }
}

using Electronic_Health_Record.Server.Models;

namespace Electronic_Health_Record.Server.Services
{
    // Employee search as it will look once backed by the real HR API. The seeded
    // implementation (SeededEmployeeDirectory) stands in until that integration
    // exists — swap the registration in Program.cs, no controller changes needed.
    public interface IEmployeeDirectory
    {
        Task<IReadOnlyList<Employee>> SearchAsync(string? query);
        Task<Employee?> FindByExternalIdAsync(string externalEmployeeId);
    }
}

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

        // Writes, for people the HR feed has not synced yet. A real HR client
        // may not accept writes at all, in which case its implementation should
        // throw NotSupportedException and the Onboarding page's employee tab
        // stops being offered — the read path above is the contract that matters
        // to the stations.
        Task<Employee> AddAsync(Employee employee);
        Task<Employee> UpdateAsync(Employee employee);
    }
}

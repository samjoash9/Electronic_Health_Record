using Electronic_Health_Record.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Services
{
    // Placeholder for ICurrentUser until real auth exists. Reads the actor id from
    // an explicit header so callers must say who they are — falling back to a
    // hardcoded id would hide the missing-auth gap instead of surfacing it.
    // Delete this once login issues real tokens and replace registration in
    // Program.cs with one that reads the authenticated principal.
    public class StubCurrentUser : ICurrentUser
    {
        public const string AdminHeader = "X-Stub-AdminID";
        public const string PhysicianHeader = "X-Stub-PhysicianID";
        public const string PatientAccountHeader = "X-Stub-PatientAccountID";

        public int? AdminID { get; }
        public int? PhysicianID { get; }
        public int? PatientAccountID { get; }
        public int? PatientID { get; }

        public StubCurrentUser(IHttpContextAccessor accessor, ElectronicHealthRecordDbContext context)
        {
            var headers = accessor.HttpContext?.Request.Headers;

            AdminID = ParseHeader(headers, AdminHeader);
            PhysicianID = ParseHeader(headers, PhysicianHeader);
            PatientAccountID = ParseHeader(headers, PatientAccountHeader);

            if (PatientAccountID.HasValue)
            {
                PatientID = context.PatientAccounts
                    .Where(a => a.PatientAccountID == PatientAccountID.Value)
                    .Select(a => (int?)a.PatientID)
                    .FirstOrDefault();
            }
        }

        private static int? ParseHeader(IHeaderDictionary? headers, string name)
        {
            if (headers is null || !headers.TryGetValue(name, out var value))
                return null;

            return int.TryParse(value, out var id) ? id : null;
        }
    }
}

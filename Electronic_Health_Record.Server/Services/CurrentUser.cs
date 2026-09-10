using System.Security.Claims;
using Electronic_Health_Record.Server.Data;

namespace Electronic_Health_Record.Server.Services
{
    public class CurrentUser : ICurrentUser
    {
        public int? AdminID { get; }
        public int? PhysicianID { get; }
        public int? PatientAccountID { get; }
        public int? PatientID { get; }

        public CurrentUser(
            IHttpContextAccessor accessor,
            ElectronicHealthRecordDbContext context)
        {
            var user = accessor.HttpContext?.User;

            var principalType = user?
                .FindFirst("PrincipalType")?
                .Value;

            var idClaim = user?
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (user?.Identity?.IsAuthenticated != true)
            {
                return;
            }

            if (!int.TryParse(idClaim, out var id))
            {
                return;
            }

            switch (principalType)
            {
                case "Admin":
                    AdminID = id;
                    break;

                case "Physician":
                    PhysicianID = id;
                    break;

                case "Patient":
                    PatientAccountID = id;

                    PatientID = context.PatientAccounts
                        .Where(a => a.PatientAccountID == id)
                        .Select(a => (int?)a.PatientID)
                        .FirstOrDefault();

                    break;
            }
        }
    }
}
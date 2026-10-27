using System.Security.Claims;
using Electronic_Health_Record.Server.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Filters
{
    /// <summary>
    /// Marks the few actions an account may still call while it is on its
    /// default password: reading itself, changing the password, signing out.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public sealed class AllowPendingPasswordChangeAttribute : Attribute;

    /// <summary>
    /// Every account is provisioned on a shared default password with
    /// MustChangePassword set. Until it is replaced, refuse everything except
    /// the actions marked [AllowPendingPasswordChange] -- otherwise anyone who
    /// knows the default could use an untouched account indefinitely, and the
    /// client's prompt would be the only thing standing in the way.
    ///
    /// The flag is read from the database on each request rather than baked
    /// into the JWT, so the gate lifts the moment the password changes instead
    /// of when the token next expires.
    /// </summary>
    public class PasswordChangeRequiredFilter : IAsyncAuthorizationFilter
    {
        public const string Code = "PasswordChangeRequired";

        private readonly ElectronicHealthRecordDbContext _db;

        public PasswordChangeRequiredFilter(ElectronicHealthRecordDbContext db)
        {
            _db = db;
        }

        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;
            if (user.Identity?.IsAuthenticated != true)
                return;

            // Login is anonymous but a stale bearer header still authenticates
            // the request; it must not be what stops a flagged user signing in.
            var metadata = context.ActionDescriptor.EndpointMetadata;
            if (metadata.OfType<IAllowAnonymous>().Any()
                || metadata.OfType<AllowPendingPasswordChangeAttribute>().Any())
                return;

            if (!int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id))
                return;

            var mustChange = user.FindFirstValue("PrincipalType") switch
            {
                "Admin" => await _db.Admins
                    .Where(a => a.AdminID == id)
                    .Select(a => a.MustChangePassword)
                    .FirstOrDefaultAsync(),
                "Physician" => await _db.Physicians
                    .Where(p => p.PhysicianID == id)
                    .Select(p => p.MustChangePassword)
                    .FirstOrDefaultAsync(),
                "Patient" => await _db.PatientAccounts
                    .Where(a => a.PatientAccountID == id)
                    .Select(a => a.MustChangePassword)
                    .FirstOrDefaultAsync(),
                _ => false,
            };

            if (mustChange)
            {
                context.Result = new ObjectResult(new
                {
                    message = "Change your password before continuing.",
                    code = Code,
                })
                {
                    StatusCode = StatusCodes.Status403Forbidden,
                };
            }
        }
    }
}

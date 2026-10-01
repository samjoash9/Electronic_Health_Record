using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Admin;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<AdminController> _logger;
        private readonly ICurrentUser _currentUser;

        public AdminController(
            ElectronicHealthRecordDbContext context,
            ILogger<AdminController> logger,
            ICurrentUser currentUser)
        {
            _context = context;
            _logger = logger;
            _currentUser = currentUser;
        }

        // get all admin
        //
        // Superadmin only: the roster of staff accounts and their permission
        // tiers is exactly the shape of an attacker's target list, and managing
        // other admins is a superadmin capability anyway. This was previously
        // open to anonymous callers.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpGet("")]
        public async Task<IActionResult> GetAdmins()
        {
            try
            {
                // projected, never the raw entity: Admin carries PasswordHash
                var admins = await _context.Admins
                    .Select(a => new
                    {
                        a.AdminID,
                        a.Username,
                        a.Role,
                        a.ContactNo,
                        a.FullName,
                        a.IsActive,
                        a.LastLoginAt,
                        a.CreatedAt,
                        a.UpdatedAt
                    })
                    .ToListAsync();
                return Ok(new { data = admins });
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve Admins.");
                return StatusCode(500, "An error occurred while retrieving Admins.");
            }
        }

        // get specific admin
        [Authorize]
        [HttpGet("{AdminID:int}")]
        public async Task<IActionResult> GetAdmin(int AdminID)
        {
            try
            {
                var admin = await _context.Admins.FindAsync(AdminID);

                if (admin == null)
                    return NotFound($"Admin with ID {AdminID} was not found.");

                // projected, never the raw entity: Admin carries PasswordHash
                return Ok(new
                {
                    admin.AdminID,
                    admin.Username,
                    admin.Role,
                    admin.ContactNo,
                    admin.FullName,
                    admin.IsActive,
                    admin.LastLoginAt,
                    admin.CreatedAt,
                    admin.UpdatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Admin {Admin}.", AdminID);
                return StatusCode(500, "An error occurred while retrieving the Admin.");
            }
        }
        // PATCH /api/Admin/{AdminID}  -> deactivate or restore a staff login
        //
        // The reversible option, and the one to reach for first: the account and
        // every id it holds on existing records stay exactly where they are, only
        // sign-in stops.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpPatch("{AdminID:int}")]
        public async Task<IActionResult> SetAdminStatus(int AdminID, [FromBody] SetAdminStatusDto dto)
        {
            var admin = await _context.Admins.FindAsync(AdminID);
            if (admin == null)
                return NotFound($"Admin with ID {AdminID} was not found.");

            // Locking yourself out is not recoverable from inside the app: no
            // other account can restore you if you were the last superadmin.
            if (!dto.IsActive && AdminID == _currentUser.AdminID)
                return BadRequest(new { message = "You cannot deactivate your own account." });

            if (!dto.IsActive && admin.Role == AdminRoles.SuperAdmin
                && await LastActiveSuperAdminAsync(AdminID))
            {
                return BadRequest(new
                {
                    message = "This is the last active superadmin. Promote another account first."
                });
            }

            admin.IsActive = dto.IsActive;
            admin.UpdatedAt = DateTime.UtcNow;

            // A deactivated account must stop being able to act, not merely stop
            // being able to sign in again -- existing sessions are cut here.
            if (!dto.IsActive)
                await RevokeSessionsAsync(AdminID);

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Admin {AdminID} ({Username}) was {State} by {ActorID}.",
                AdminID, admin.Username, dto.IsActive ? "reactivated" : "deactivated",
                _currentUser.AdminID);

            return Ok(AdminResponseDto.From(admin));
        }

        // DELETE /api/Admin/{AdminID}  -> remove a staff account permanently
        //
        // Superadmin only, and irreversible. Work the account did is kept: the
        // stations it staffed carry Station1AdminName/Station2AdminName, so a
        // wellness form still says who took the vitals and ran the assessment
        // once the id is gone, and the audit log holds ActorID with no FK at all.
        // Deactivation is the reversible option -- this one is not.
        [Authorize(Roles = AdminRoles.SuperAdmin)]
        [HttpDelete("{AdminID:int}")]
        public async Task<IActionResult> DeleteAdmin(int AdminID)
        {
            var admin = await _context.Admins.FindAsync(AdminID);
            if (admin == null)
                return NotFound($"Admin with ID {AdminID} was not found.");

            // Deleting the account you are signed in as revokes the session
            // mid-request and leaves no one able to undo it.
            if (AdminID == _currentUser.AdminID)
                return BadRequest(new { message = "You cannot delete your own account." });

            // Never leave the system with no way back in.
            if (admin.Role == AdminRoles.SuperAdmin && await LastActiveSuperAdminAsync(AdminID))
            {
                return BadRequest(new
                {
                    message = "This is the last active superadmin. Promote another account first."
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Backfill the attribution snapshot before the id goes. Forms
                // submitted since the snapshot columns shipped already carry the
                // name; the coalesce covers rows filled before that.
                var station1 = await _context.WellnessForms
                    .Where(f => f.Station1AdminID == AdminID)
                    .ToListAsync();
                foreach (var form in station1)
                {
                    form.Station1AdminName ??= admin.FullName;
                    form.Station1AdminID = null;
                }

                var station2 = await _context.WellnessForms
                    .Where(f => f.Station2AdminID == AdminID)
                    .ToListAsync();
                foreach (var form in station2)
                {
                    form.Station2AdminName ??= admin.FullName;
                    form.Station2AdminID = null;
                }

                // Bookkeeping columns, not clinical attribution: the audit log
                // keeps who did what, so these just lose their id.
                var created = await _context.WellnessForms
                    .Where(f => f.CreatedByAdminID == AdminID)
                    .ToListAsync();
                foreach (var form in created)
                    form.CreatedByAdminID = null;

                var updated = await _context.WellnessForms
                    .Where(f => f.UpdatedByAdminID == AdminID)
                    .ToListAsync();
                foreach (var form in updated)
                    form.UpdatedByAdminID = null;

                var charges = await _context.ChargeItems
                    .Where(c => c.UpdatedByAdminID == AdminID)
                    .ToListAsync();
                foreach (var item in charges)
                    item.UpdatedByAdminID = null;

                var billing = await _context.BillingForms
                    .Where(b => b.CreatedByAdminID == AdminID)
                    .ToListAsync();
                foreach (var form in billing)
                    form.CreatedByAdminID = null;

                // Sessions are not records of anything, so they go with the account.
                await RevokeSessionsAsync(AdminID);

                // Detach before the delete: AdminSession stays Restrict as a
                // backstop, so the row cannot go while anything still points at it.
                await _context.SaveChangesAsync();

                _context.Admins.Remove(admin);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                _logger.LogInformation(
                    "Deleted admin {AdminID} ({Username}) by {ActorID}; detached {S1} Station 1 and {S2} Station 2 attributions.",
                    AdminID, admin.Username, _currentUser.AdminID, station1.Count, station2.Count);

                return Ok(new { adminID = AdminID });
            }
            catch (Exception e)
            {
                await transaction.RollbackAsync();
                _logger.LogError(e, "Failed to delete Admin {AdminID}.", AdminID);
                return StatusCode(500, "An error occurred while deleting the account.");
            }
        }

        // True when AdminID is the only superadmin still able to sign in. Guards
        // both the deactivate and the delete paths from locking everyone out.
        private async Task<bool> LastActiveSuperAdminAsync(int AdminID) =>
            !await _context.Admins.AnyAsync(a =>
                a.AdminID != AdminID
                && a.Role == AdminRoles.SuperAdmin
                && a.IsActive);

        private async Task RevokeSessionsAsync(int AdminID)
        {
            var sessions = await _context.AdminSessions
                .Where(s => s.AdminID == AdminID)
                .ToListAsync();
            _context.AdminSessions.RemoveRange(sessions);
        }
    }
}

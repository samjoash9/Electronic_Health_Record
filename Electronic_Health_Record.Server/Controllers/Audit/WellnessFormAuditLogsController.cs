using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Audit;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Audit
{
    [ApiController]
    [Route("api/[controller]")]
    // Superadmin only: these logs carry patient names alongside the full edit
    // history of every form, and the client only ever opens this page behind a
    // superadmin guard (see the /activity-logs route in routes.jsx). The API
    // was previously anonymous, so the UI restriction was the only thing
    // standing between an unauthenticated caller and that data.
    [Authorize(Roles = AdminRoles.SuperAdmin)]
    public class WellnessFormAuditLogsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;

        public WellnessFormAuditLogsController(ElectronicHealthRecordDbContext context)
        {
            _context = context;
        }

        // GET /api/wellnessformauditlogs
        // actorName and the nested patient are computed here rather than stored --
        // mirrors getActivityLogs in src/api/forms.api.js, which fakes the same
        // two-hop joins (log -> actor table, log -> form -> patient) in the mock.
        [HttpGet("")]
        public async Task<IActionResult> GetLogs()
        {
            var logs = await _context.WellnessFormAuditLogs
                .OrderByDescending(l => l.OccurredAt)
                .ToListAsync();

            // Only the form -> patient hop is needed. Reading whole WellnessForm
            // rows here pulled all three base64 signatures of every logged form.
            var formIds = logs.Select(l => l.FormID).Distinct().ToList();
            var patientIdByFormId = await _context.WellnessForms
                .Where(f => formIds.Contains(f.FormID))
                .Select(f => new { f.FormID, f.PatientID })
                .ToDictionaryAsync(f => f.FormID, f => f.PatientID);

            var patientIds = patientIdByFormId.Values.Distinct().ToList();
            var patientsById = await _context.Patients
                .Where(p => patientIds.Contains(p.PatientID))
                .ToDictionaryAsync(p => p.PatientID);

            var adminIds = logs.Where(l => l.ActorType == "Admin" && l.ActorID.HasValue)
                .Select(l => l.ActorID!.Value).Distinct().ToList();
            var adminsById = await _context.Admins
                .Where(a => adminIds.Contains(a.AdminID))
                .ToDictionaryAsync(a => a.AdminID);

            var physicianIds = logs.Where(l => l.ActorType == "Physician" && l.ActorID.HasValue)
                .Select(l => l.ActorID!.Value).Distinct().ToList();
            var physiciansById = await _context.Physicians
                .Where(p => physicianIds.Contains(p.PhysicianID))
                .ToDictionaryAsync(p => p.PhysicianID);

            var response = logs.Select(log =>
            {
                var patient = patientIdByFormId.TryGetValue(log.FormID, out var patientId)
                    && patientsById.TryGetValue(patientId, out var p) ? p : null;

                return new
                {
                    log.LogID,
                    log.FormID,
                    log.ActorType,
                    log.ActorID,
                    log.Action,
                    log.Details,
                    log.OccurredAt,
                    ActorName = ActorName(log.ActorType, log.ActorID, adminsById, physiciansById),
                    Patient = patient,
                };
            });

            return Ok(response);
        }

        // DELETE /api/wellnessformauditlogs
        // Body: { logIDs: [1, 2, 3] }. Hard delete, superadmin only (the
        // controller's [Authorize]). Nothing records the deletion itself -- a
        // deliberate choice to keep the table small, at the cost of these
        // entries being gone for good. IDs that no longer exist (already
        // deleted in another tab, say) are skipped rather than failing the
        // batch, so the response says how many rows actually went.
        [HttpDelete("")]
        public async Task<IActionResult> DeleteLogs([FromBody] DeleteAuditLogsDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var ids = dto.LogIDs.Distinct().ToList();
            var deleted = await _context.WellnessFormAuditLogs
                .Where(l => ids.Contains(l.LogID))
                .ExecuteDeleteAsync();

            return Ok(new { Deleted = deleted });
        }

        private static string ActorName(
            string actorType,
            int? actorID,
            Dictionary<int, Models.Admin> adminsById,
            Dictionary<int, Models.Physician> physiciansById)
        {
            if (actorType == "Admin")
            {
                if (actorID.HasValue && adminsById.TryGetValue(actorID.Value, out var admin))
                    return admin.FullName;
                return $"Admin #{actorID}";
            }

            if (actorType == "Physician")
            {
                if (actorID.HasValue && physiciansById.TryGetValue(actorID.Value, out var physician))
                    return $"Dr. {physician.FirstName} {physician.Surname}";
                return $"Physician #{actorID}";
            }

            return actorType;
        }
    }
}

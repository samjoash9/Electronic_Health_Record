using Electronic_Health_Record.Server.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Audit
{
    [ApiController]
    [Route("api/[controller]")]
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

            var formIds = logs.Select(l => l.FormID).Distinct().ToList();
            var formsById = await _context.WellnessForms
                .Where(f => formIds.Contains(f.FormID))
                .ToDictionaryAsync(f => f.FormID);

            var patientIds = formsById.Values.Select(f => f.PatientID).Distinct().ToList();
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
                formsById.TryGetValue(log.FormID, out var form);
                var patient = form != null && patientsById.TryGetValue(form.PatientID, out var p) ? p : null;

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

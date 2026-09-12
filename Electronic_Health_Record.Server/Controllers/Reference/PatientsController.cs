using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Patient;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Authorization;

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Scaffolding.Metadata;
using System.Runtime.InteropServices;


namespace Electronic_Health_Record.Server.Controllers.Reference
{
    [ApiController]
    [Route("api/[controller]")]  
    public class PatientsController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<PatientsController> _logger;

        public PatientsController(
            ElectronicHealthRecordDbContext context,
            ILogger<PatientsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // get all patients
        [Authorize]
        [HttpGet("")]
        public async Task<IActionResult> GetPatients()
        {
            try
            {
                var patients = await _context.Patients.ToListAsync();
                return Ok(new { data = patients });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve patients.");
                return StatusCode(500, "An error occurred while retrieving patients.");
            }
        }

        // get specific patient
        [Authorize]
        [HttpGet("{PatientId}")]
        public async Task<IActionResult> GetPatient(int PatientId)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(PatientId);

                if (patient == null)
                    return NotFound($"Patient with ID {PatientId} was not found.");

                return Ok(patient);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve patient {PatientId}.", PatientId);
                return StatusCode(500, "An error occurred while retrieving the patient.");
            }
        }

        // register new patient
        [Authorize]
        [HttpPost("")]
        public async Task<IActionResult> CreatePatient([FromBody] CreatePatientDto dto)
        {
            // check if input is valid
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            try
            {
                var patient = new Patient
                {
                    Surname = dto.Surname,
                    FirstName = dto.FirstName,
                    MiddleName = dto.MiddleName,
                    Birthdate = dto.Birthdate,
                    Sex = dto.Sex,
                    CivilStatus = dto.CivilStatus,
                    Address = dto.Address,
                    AgencyOffice = dto.AgencyOffice,
                    Position = dto.Position,
                    ContactNo = dto.ContactNo
                    // for the CreatedAt and UpdatedAt is handled by DB defaults
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                        nameof(GetPatient),
                        new { PatientId = patient.PatientID },
                        patient);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to create patient.");
                return StatusCode(500, "An error occurred while creating the patient.");
            }
        }

        // GET /api/patients/has-account/{externalEmployeeId}
        // Lets Station 1 know, once an employee is picked, whether a
        // PatientAccount already exists for them -- if not, the admin must
        // ask the patient for a desired username before submitting.
        [Authorize]
        [HttpGet("has-account/{externalEmployeeId}")]
        public async Task<IActionResult> HasAccount(string externalEmployeeId)
        {
            try
            {
                var patientID = await _context.Patients
                    .Where(p => p.ExternalEmployeeId == externalEmployeeId)
                    .Select(p => (int?)p.PatientID)
                    .FirstOrDefaultAsync();

                var hasAccount = patientID.HasValue
                    && await _context.PatientAccounts.AnyAsync(a => a.PatientID == patientID.Value);

                return Ok(new { hasAccount });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to check account status for employee {ExternalEmployeeId}.", externalEmployeeId);
                return StatusCode(500, "An error occurred while checking account status.");
            }
        }

        // GET /api/patients/accounts
        // Every patient with the portal account Station 1 provisioned for them,
        // for the admin Patients panel. Staff-only: a patient must never be able
        // to enumerate other patients' login handles.
        //
        // Account is null for a Patient row the HR sync created but that has
        // never been registered at Station 1, so the panel can show those as
        // "not onboarded" rather than hiding them.
        [Authorize(Roles = $"{AdminRoles.Admin},{AdminRoles.SuperAdmin}")]
        [HttpGet("accounts")]
        public async Task<IActionResult> GetPatientAccounts()
        {
            try
            {
                // Left-joined in one query rather than per-patient lookups --
                // PatientAccount is 1:1 with Patient (see the HasOne/WithOne in
                // ElectronicHealthRecordDbContext), so this cannot fan out.
                var rows = await _context.Patients
                    .GroupJoin(
                        _context.PatientAccounts,
                        p => p.PatientID,
                        a => a.PatientID,
                        (p, accounts) => new { Patient = p, Accounts = accounts })
                    .SelectMany(
                        x => x.Accounts.DefaultIfEmpty(),
                        (x, account) => new PatientWithAccountDto
                        {
                            PatientID = x.Patient.PatientID,
                            ExternalEmployeeId = x.Patient.ExternalEmployeeId,
                            Surname = x.Patient.Surname,
                            FirstName = x.Patient.FirstName,
                            MiddleName = x.Patient.MiddleName,
                            Birthdate = x.Patient.Birthdate,
                            Sex = x.Patient.Sex,
                            AgencyOffice = x.Patient.AgencyOffice,
                            Position = x.Patient.Position,
                            ContactNo = x.Patient.ContactNo,
                            CreatedAt = x.Patient.CreatedAt,
                            // never the raw entity here: PatientAccount carries PasswordHash
                            Account = account == null ? null : new PatientAccountDto
                            {
                                PatientAccountID = account.PatientAccountID,
                                PatientID = account.PatientID,
                                Username = account.Username,
                                Status = account.Status,
                                MustChangePassword = account.MustChangePassword,
                                ProvisionedAt = account.ProvisionedAt,
                                ActivatedAt = account.ActivatedAt,
                                LastLoginAt = account.LastLoginAt,
                            },
                        })
                    .OrderBy(p => p.Surname)
                    .ThenBy(p => p.FirstName)
                    .ToListAsync();

                return Ok(rows);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve patient accounts.");
                return StatusCode(500, "An error occurred while retrieving patient accounts.");
            }
        }

        // PUT    /api/patients/:id → full update (edit patient profile)


        // PATCH  /api/patients/:id → partial update

        // DELETE /api/patients/:id → delete/deactivate patient

        // GET    /api/patients/:id/consultations → list this patient's visit history
    }
}

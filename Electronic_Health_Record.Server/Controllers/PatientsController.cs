using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
using System.Runtime.InteropServices;
using Microsoft.EntityFrameworkCore.Query;
using Electronic_Health_Record.Server.DTOs.Patient;
using Microsoft.EntityFrameworkCore.Scaffolding.Metadata;


namespace Electronic_Health_Record.Server.Controllers
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

        // PUT    /api/patients/:id → full update (edit patient profile)


        // PATCH  /api/patients/:id → partial update

        // DELETE /api/patients/:id → delete/deactivate patient

        // GET    /api/patients/:id/consultations → list this patient's visit history
    }
}

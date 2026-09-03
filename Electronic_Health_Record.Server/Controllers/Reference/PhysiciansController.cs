using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Physician;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reference
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhysiciansController : Controller
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<PhysiciansController> _logger;
        public PhysiciansController(
            ElectronicHealthRecordDbContext context,
            ILogger<PhysiciansController> logger)
        {
            _context = context;
            _logger = logger;
        }

        //GET    /api/physicians          → list all ph{ysicians(for "assign physician" dropdown)
        [HttpGet("")]
        public async Task<IActionResult> GetPhysicians()
        {
            try
            {
                var physicians = await _context.Physicians.ToListAsync();
                return Ok(new { data = physicians });
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve physicians.");
                return StatusCode(500, "An error occurred while retrieving physicians.");
            }
        }

        // GET count of physicians
        [HttpGet("count")]
        public async Task<IActionResult> GetPhysicianCount()
        {
            try
            {
                var count = await _context.Physicians.CountAsync();
                return Ok(count);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve physicians count.");
                return StatusCode(500, "An error occured while retrieving the physician count.");
            }
        }

        //GET    /api/physicians/:id      → get one physician's profile
        [HttpGet("{PhysicianID}")]
        public async Task<IActionResult> GetPhysician(int PhysicianID)
        {
            try
            {
                var physician = await _context.Physicians.FindAsync(PhysicianID);

                if (physician == null)
                    return NotFound($"Physician with ID {PhysicianID} was not found.");

                return Ok(physician);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve physician {PhysicianID}", PhysicianID);
                return StatusCode(500, "An error occured while retrieving the physician.");
            }
        }

        //POST   /api/physicians          → register new physician
        [HttpPost("")]
        public async Task<IActionResult> CreatePhysician([FromBody] CreatePhysicianDto dto)
        {
            // check if inpt is valid
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var physician = new Physician
                {
                    Surname = dto.Surname,
                    FirstName = dto.FirstName,
                    MiddleName = dto.MiddleName,
                    PRCLicenseNo = dto.PRCLicenseNo
                    // the rest are handled by db defaults (CreatedAt and UpdatedAt)
                };

                _context.Physicians.Add(physician);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetPhysician),
                    new { PhysicianID = physician.PhysicianID },
                    physician);
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to create physician.");
                return StatusCode(500, "An error occurred while creating the physician.");
            }
        }

        //PUT    /api/physicians/:id      → full update
        [HttpPut("{physicianId}")]
        public async Task<IActionResult> UpdatePhysician(
            int physicianId,
            [FromBody] UpdatePhysicianDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var physician = await _context.Physicians.FindAsync(physicianId);
            if (physician == null)
                return NotFound($"Physician with ID {physicianId} was not found.");

            // Check PRC license uniqueness (excluding this physician)
            bool licenseTaken = await _context.Physicians
                .AnyAsync(p => p.PRCLicenseNo == dto.PRCLicenseNo && p.PhysicianID != physicianId);
            if (licenseTaken)
                return Conflict($"PRC License No. {dto.PRCLicenseNo} is already registered to another physician.");

            physician.Surname = dto.Surname;
            physician.FirstName = dto.FirstName;
            physician.MiddleName = dto.MiddleName;
            physician.PRCLicenseNo = dto.PRCLicenseNo;
            physician.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("The physician record was modified by another process. Please reload and try again.");
            }
            catch (DbUpdateException)
            {
                // Log the exception here
                return Conflict("Unable to update physician. The data may violate a database constraint.");
            }

            var response = new PhysicianResponseDto
            {
                PhysicianID = physician.PhysicianID,
                Surname = physician.Surname,
                FirstName = physician.FirstName,
                MiddleName = physician.MiddleName,
                PRCLicenseNo = physician.PRCLicenseNo,
                CreatedAt = physician.CreatedAt,
                UpdatedAt = physician.UpdatedAt
            };

            return Ok(response);
        }

        //PATCH  /api/physicians/:id      → partial update
        [HttpPatch("{physicianId}")]
        public async Task<IActionResult> PatchPhysician(
            int physicianId,
            [FromBody] PatchPhysicianDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var physician = await _context.Physicians.FindAsync(physicianId);
            if (physician == null)
                return NotFound($"Physician with ID {physicianId} was not found.");

            // Only check uniqueness if the client is actually changing the license no.
            if (dto.PRCLicenseNo != null && dto.PRCLicenseNo != physician.PRCLicenseNo)
            {
                bool licenseTaken = await _context.Physicians
                    .AnyAsync(p => p.PRCLicenseNo == dto.PRCLicenseNo && p.PhysicianID != physicianId);
                if (licenseTaken)
                    return Conflict($"PRC License No. {dto.PRCLicenseNo} is already registered to another physician.");

                physician.PRCLicenseNo = dto.PRCLicenseNo;
            }

            if (dto.Surname != null)
                physician.Surname = dto.Surname;

            if (dto.FirstName != null)
                physician.FirstName = dto.FirstName;

            if (dto.MiddleName != null)
                physician.MiddleName = dto.MiddleName;

            physician.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("The physician record was modified by another process. Please reload and try again.");
            }
            catch (DbUpdateException e)
            {
                _logger.LogError(e, "Failed to patch physician {PhysicianID}", physicianId);
                return Conflict("Unable to update physician. The data may violate a database constraint.");
            }

            var response = new PhysicianResponseDto
            {
                PhysicianID = physician.PhysicianID,
                Surname = physician.Surname,
                FirstName = physician.FirstName,
                MiddleName = physician.MiddleName,
                PRCLicenseNo = physician.PRCLicenseNo,
                CreatedAt = physician.CreatedAt,
                UpdatedAt = physician.UpdatedAt
            };

            return Ok(response);
        }


        //DELETE /api/physicians/:id      → delete/deactivate
        [HttpDelete("{physicianId}")]
        public async Task<IActionResult> DeletePhysician(int physicianId)
        {
            var physician = await _context.Physicians.FindAsync(physicianId);
            if (physician == null)
                return NotFound($"Physician with ID {physicianId} was not found.");

            try
            {
                _context.Physicians.Remove(physician);
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException e)
            {
                _logger.LogError(e, "Failed to delete physician {PhysicianID}", physicianId);
                // Most likely an FK constraint (physician referenced by appointments, prescriptions, etc.)
                return Conflict("Unable to delete physician. This physician may have associated records (appointments, prescriptions, etc.).");
            }

            return NoContent();
        }

    }
}

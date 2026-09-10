using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Physician;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Reference
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhysiciansController : Controller
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ILogger<PhysiciansController> _logger;
        public PhysiciansController(
            ElectronicHealthRecordDbContext context,
            IPasswordHasher passwordHasher,
            ILogger<PhysiciansController> logger)
        {
            _context = context;
            _passwordHasher = passwordHasher;
            _logger = logger;
        }

        // The fields a client may read. Built in one place so no endpoint can
        // forget to project and hand back PasswordHash with the rest of the row.
        private static PhysicianResponseDto ToResponse(Physician p) => new()
        {
            PhysicianID = p.PhysicianID,
            Username = p.Username,
            Surname = p.Surname,
            FirstName = p.FirstName,
            MiddleName = p.MiddleName,
            PRCLicenseNo = p.PRCLicenseNo,
            ContactNo = p.ContactNo,
            MustChangePassword = p.MustChangePassword,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };

        //GET    /api/physicians          → list all ph{ysicians(for "assign physician" dropdown)
        [HttpGet("")]
        public async Task<IActionResult> GetPhysicians()
        {
            try
            {
                // projected, never the raw entity: Physician now carries PasswordHash
                var physicians = await _context.Physicians
                    .OrderBy(p => p.Surname).ThenBy(p => p.FirstName)
                    .Select(p => ToResponse(p))
                    .ToListAsync();
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

                // projected, never the raw entity: Physician now carries PasswordHash
                return Ok(ToResponse(physician));
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

            var username = dto.Username.Trim();

            // Checked up front for a clear 409 rather than letting the unique
            // indexes surface as an opaque DbUpdateException.
            if (await _context.Physicians.AnyAsync(p => p.Username == username))
                return Conflict($"The username \"{username}\" is already taken.");

            if (await _context.Physicians.AnyAsync(p => p.PRCLicenseNo == dto.PRCLicenseNo))
                return Conflict($"PRC License No. {dto.PRCLicenseNo} is already registered to another physician.");

            try
            {
                var now = DateTime.UtcNow;
                var physician = new Physician
                {
                    Username = username,
                    PasswordHash = _passwordHasher.Hash(dto.Password),
                    // Onboarded on a password an admin handed over: it only
                    // survives until the doctor's first sign-in.
                    MustChangePassword = true,
                    PasswordSetAt = now,
                    PasswordChangedAt = null,
                    Surname = dto.Surname,
                    FirstName = dto.FirstName,
                    MiddleName = dto.MiddleName,
                    PRCLicenseNo = dto.PRCLicenseNo,
                    ContactNo = dto.ContactNo,
                    IsActive = true
                    // the rest are handled by db defaults (CreatedAt and UpdatedAt)
                };

                _context.Physicians.Add(physician);
                await _context.SaveChangesAsync();

                return CreatedAtAction(
                    nameof(GetPhysician),
                    new { PhysicianID = physician.PhysicianID },
                    ToResponse(physician));
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
            physician.ContactNo = dto.ContactNo;
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

            return Ok(ToResponse(physician));
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

            if (dto.ContactNo != null)
                physician.ContactNo = dto.ContactNo;

            // Deactivation retires an account without deleting the row every
            // form this doctor signed still points at.
            if (dto.IsActive.HasValue)
                physician.IsActive = dto.IsActive.Value;

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

            return Ok(ToResponse(physician));
        }


        // POST /api/physicians/:id/password → issue a replacement temporary password
        //
        // Separate from PATCH so a credential change is never a side effect of a
        // profile edit, and so the response carries no password material.
        [HttpPost("{physicianId}/password")]
        public async Task<IActionResult> SetPhysicianPassword(
            int physicianId,
            [FromBody] SetPhysicianPasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var physician = await _context.Physicians.FindAsync(physicianId);
            if (physician == null)
                return NotFound($"Physician with ID {physicianId} was not found.");

            var now = DateTime.UtcNow;
            physician.PasswordHash = _passwordHasher.Hash(dto.Password);
            // Back on an issued password: the doctor has to replace it, and
            // PasswordChangedAt stays where it was so "never chose their own"
            // remains distinguishable.
            physician.MustChangePassword = true;
            physician.PasswordSetAt = now;
            physician.UpdatedAt = now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException e)
            {
                _logger.LogError(e, "Failed to reset the password for physician {PhysicianID}", physicianId);
                return StatusCode(500, "An error occurred while resetting the password.");
            }

            return Ok(ToResponse(physician));
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

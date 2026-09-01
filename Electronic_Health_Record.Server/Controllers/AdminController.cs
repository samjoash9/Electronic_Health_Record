using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Admin;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace Electronic_Health_Record.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ElectronicHealthRecordDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            ElectronicHealthRecordDbContext context,
            ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // get all admin
        [HttpGet("")]
        public async Task<IActionResult> GetAdmins()
        {
            try
            {
                // projected, never the entity: the Admin row carries a password hash
                var admins = await _context.Admins
                    .Select(a => AdminResponseDto.From(a))
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
        [HttpGet("{AdminID}")]
        public async Task<IActionResult> GetAdmin(int AdminID)
        {
            try
            {
                var admin = await _context.Admins.FindAsync(AdminID);

                if (admin == null)
                    return NotFound($"Admin with ID {AdminID} was not found.");

                return Ok(AdminResponseDto.From(admin));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Admin {Admin}.", AdminID);
                return StatusCode(500, "An error occurred while retrieving the Admin.");
            }
        }
    }
}

using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;
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
                var admins = await _context.Admins.ToListAsync();
                return Ok(new { data = admins });
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to retrieve Admins.");
                return StatusCode(500, "An error occurred while retrieving Admins.");
            }
        }

        // get specific admin
        [HttpGet("{AdminID}")]
        public async Task<IActionResult> GetAdmin(int AdminID)
        {
            try
            {
                var admin = await _context.Admins.FindAsync(AdminID);

                if (admin == null)
                    return NotFound($"Admin with ID {AdminID} was not found.");

                return Ok(admin);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve Admin {Admin}.", AdminID);
                return StatusCode(500, "An error occurred while retrieving the Admin.");
            }
        }
    }
}

using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.User;
using Electronic_Health_Record.Server.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Users;

[ApiController]
[Route("api/users")]
public class UserManagementController : ControllerBase
{
    private readonly ElectronicHealthRecordDbContext _db;

    private readonly PasswordHasher<Admin> _adminPasswordHasher = new();
    private readonly PasswordHasher<Physician> _physicianPasswordHasher = new();

    private const string DefaultPassword = "password123";

    public UserManagementController(ElectronicHealthRecordDbContext db)
    {
        _db = db;
    }

    // =========================================================
    // CREATE ADMIN
    // =========================================================

    [Authorize(Roles = Roles.SuperAdmin)]
    [HttpPost("admin")]
    public async Task<ActionResult<CreateAdminResponse>> CreateAdmin(
        CreateAdminRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Email and full name are required."
            });
        }

        var email = request.Email.Trim();

        if (await _db.Admins.AnyAsync(a => a.Email == email))
        {
            return BadRequest(new
            {
                message = "That email is already in use."
            });
        }

        // -----------------------------------------------------
        // Create Admin
        // -----------------------------------------------------

        var admin = new Admin
        {
            Email = email,
            FullName = request.FullName.Trim(),
            Role = Roles.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Default password
        admin.PasswordHash =
            _adminPasswordHasher.HashPassword(admin, DefaultPassword);

        _db.Admins.Add(admin);
        await _db.SaveChangesAsync();

        return Ok(new CreateAdminResponse
        {
            AdminID = admin.AdminID,
            Email = admin.Email,
            FullName = admin.FullName,
            Role = admin.Role,
            TemporaryPassword = DefaultPassword
        });
    }

    // =========================================================
    // CREATE PHYSICIAN
    // =========================================================

    [Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
    [HttpPost("physician")]
    public async Task<ActionResult<CreatePhysicianResponse>> CreatePhysician(
        CreatePhysicianRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Surname) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.PRCLicenseNo))
        {
            return BadRequest(new
            {
                message = "Surname, first name, and PRC licence number are required."
            });
        }

        if (request.GrantPortalAccess &&
            string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email is required when granting portal access."
            });
        }

        var prcLicenseNo = request.PRCLicenseNo.Trim();

        if (await _db.Physicians.AnyAsync(p =>
            p.PRCLicenseNo == prcLicenseNo))
        {
            return BadRequest(new
            {
                message = "A physician with that PRC licence number already exists."
            });
        }

        // -----------------------------------------------------
        // Build Physician
        // -----------------------------------------------------

        var physician = new Physician
        {
            Surname = request.Surname.Trim(),
            FirstName = request.FirstName.Trim(),
            MiddleName = string.IsNullOrWhiteSpace(request.MiddleName)
                ? null
                : request.MiddleName.Trim(),

            PRCLicenseNo = prcLicenseNo,

            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        string? temporaryPassword = null;

        // -----------------------------------------------------
        // Grant Portal Access
        // -----------------------------------------------------

        if (request.GrantPortalAccess)
        {
            var email = request.Email!.Trim();

            if (await _db.Physicians.AnyAsync(p => p.Email == email))
            {
                return BadRequest(new
                {
                    message = "That email is already in use."
                });
            }

            physician.Email = email;

            // Default password
            temporaryPassword = DefaultPassword;

            physician.PasswordHash =
                _physicianPasswordHasher.HashPassword(
                    physician,
                    DefaultPassword
                );

            // Require password change after first login
            physician.MustChangePassword = true;
        }

        _db.Physicians.Add(physician);
        await _db.SaveChangesAsync();

        return Ok(new CreatePhysicianResponse
        {
            PhysicianID = physician.PhysicianID,
            Surname = physician.Surname,
            FirstName = physician.FirstName,
            MiddleName = physician.MiddleName,
            PRCLicenseNo = physician.PRCLicenseNo,
            Email = physician.Email,
            TemporaryPassword = temporaryPassword
        });
    }
}
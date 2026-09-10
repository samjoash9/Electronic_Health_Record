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

    [Authorize(Roles = AdminRoles.SuperAdmin)]
    [HttpPost("admin")]
    public async Task<ActionResult<CreateAdminResponse>> CreateAdmin(
        CreateAdminRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new
            {
                message = "Username and full name are required."
            });
        }

        var username = request.Username.Trim();
        var contactNo = string.IsNullOrWhiteSpace(request.ContactNo) ? null : request.ContactNo.Trim();

        if (await _db.Admins.AnyAsync(a => a.Username == username))
        {
            return BadRequest(new
            {
                message = "That username is already taken."
            });
        }

        // -----------------------------------------------------
        // Create Admin
        // -----------------------------------------------------

        var admin = new Admin
        {
            Username = username,
            ContactNo = contactNo,
            FullName = request.FullName.Trim(),
            Role = AdminRoles.Admin,
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
            Username = admin.Username,
            ContactNo = admin.ContactNo,
            FullName = admin.FullName,
            Role = admin.Role,
            TemporaryPassword = DefaultPassword
        });
    }

    // =========================================================
    // CREATE PHYSICIAN
    // =========================================================

    [Authorize(Roles = $"{AdminRoles.SuperAdmin},{AdminRoles.Admin}")]
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
            string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username is required when granting portal access."
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
            var username = request.Username!.Trim();
            var email = $"{username}@hospital.com";

            if (await _db.Physicians.AnyAsync(p =>
                p.Username == username ||
                p.Email == email))
            {
                return BadRequest(new
                {
                    message = "That username or email is already in use."
                });
            }

            physician.Username = username;
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
            Username = physician.Username,
            Email = physician.Email,
            TemporaryPassword = temporaryPassword
        });
    }
}
using System.Security.Claims;

using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Auth;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ElectronicHealthRecordDbContext _db;
    private readonly TokenService _tokenService;

    private readonly PasswordHasher<Admin> _adminPasswordHasher = new();
    private readonly PasswordHasher<Physician> _physicianPasswordHasher = new();

    public AuthController(
        ElectronicHealthRecordDbContext db,
        TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    // =========================================================
    // LOGIN
    // =========================================================

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        // -----------------------------------------------------
        // Validate request
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Email and password are required."
            });
        }

        // Normalize email
        var email = request.Email.Trim();

        // =====================================================
        // 1. CHECK ADMIN BY EMAIL
        // =====================================================

        var admin = await _db.Admins
            .FirstOrDefaultAsync(a => a.Email == email);

        if (admin != null)
        {
            // -------------------------------------------------
            // Check account status
            // -------------------------------------------------

            if (!admin.IsActive)
            {
                return Unauthorized(new
                {
                    message = "Account is inactive."
                });
            }

            // -------------------------------------------------
            // Verify password
            // -------------------------------------------------

            var passwordResult =
                _adminPasswordHasher.VerifyHashedPassword(
                    admin,
                    admin.PasswordHash,
                    request.Password
                );

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Password is valid, but the hasher wants it rewritten with current
            // parameters (e.g. iteration count bumped) - rehash and persist now
            // while we have the plaintext.
            if (passwordResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                admin.PasswordHash =
                    _adminPasswordHasher.HashPassword(admin, request.Password);
            }

            // -------------------------------------------------
            // Generate JWT
            // -------------------------------------------------

            var (token, expiresAt) =
                _tokenService.GenerateToken(admin);

            // -------------------------------------------------
            // Update last login
            // -------------------------------------------------

            admin.LastLoginAt = DateTime.UtcNow;
            admin.UpdatedAt = DateTime.UtcNow;

            // -------------------------------------------------
            // Create user session
            // -------------------------------------------------

            var session = new UserSession
            {
                AdminID = admin.AdminID,
                PhysicianID = null,

                TokenHash = HashToken(token),

                ExpiresAt = expiresAt,

                CreatedAt = DateTime.UtcNow
            };

            _db.UserSessions.Add(session);

            await _db.SaveChangesAsync();

            // -------------------------------------------------
            // Return response
            // -------------------------------------------------

            return Ok(new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,

                AdminID = admin.AdminID,

                FullName = admin.FullName,

                Role = admin.Role
            });
        }

        // =====================================================
        // 2. CHECK PHYSICIAN BY EMAIL
        // =====================================================

        var physician = await _db.Physicians
            .FirstOrDefaultAsync(p => p.Email == email);

        if (physician != null)
        {
            // -------------------------------------------------
            // Check portal access
            // -------------------------------------------------

            if (string.IsNullOrWhiteSpace(physician.PasswordHash))
            {
                return Unauthorized(new
                {
                    message = "This physician account does not have portal access."
                });
            }

            // -------------------------------------------------
            // Check account status
            // -------------------------------------------------

            if (!physician.IsActive)
            {
                return Unauthorized(new
                {
                    message = "Account is inactive."
                });
            }

            // -------------------------------------------------
            // Verify password
            // -------------------------------------------------

            var passwordResult =
                _physicianPasswordHasher.VerifyHashedPassword(
                    physician,
                    physician.PasswordHash,
                    request.Password
                );

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            // Password is valid, but the hasher wants it rewritten with current
            // parameters (e.g. iteration count bumped) - rehash and persist now
            // while we have the plaintext.
            if (passwordResult == PasswordVerificationResult.SuccessRehashNeeded)
            {
                physician.PasswordHash =
                    _physicianPasswordHasher.HashPassword(physician, request.Password);
            }

            // -------------------------------------------------
            // Generate JWT
            // -------------------------------------------------

            var (token, expiresAt) =
                _tokenService.GenerateToken(physician);

            // -------------------------------------------------
            // Update last login
            // -------------------------------------------------

            physician.LastLoginAt = DateTime.UtcNow;
            physician.UpdatedAt = DateTime.UtcNow;

            // -------------------------------------------------
            // Create user session
            // -------------------------------------------------

            var session = new UserSession
            {
                AdminID = null,

                PhysicianID = physician.PhysicianID,

                TokenHash = HashToken(token),

                ExpiresAt = expiresAt,

                CreatedAt = DateTime.UtcNow
            };

            _db.UserSessions.Add(session);

            await _db.SaveChangesAsync();

            // -------------------------------------------------
            // Return response
            // -------------------------------------------------

            return Ok(new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,

                PhysicianID = physician.PhysicianID,

                FullName =
                    $"{physician.FirstName} " +
                    $"{physician.MiddleName} " +
                    $"{physician.Surname}",

                Role = Roles.Physician
            });
        }

        // =====================================================
        // 3. NO ACCOUNT FOUND
        // =====================================================

        return Unauthorized(new
        {
            message = "Invalid email or password."
        });
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var role =
            User.FindFirst(ClaimTypes.Role)?.Value;

        var principalType =
            User.FindFirst("PrincipalType")?.Value;

        if (string.IsNullOrWhiteSpace(userId) ||
            string.IsNullOrWhiteSpace(role))
        {
            return Unauthorized();
        }

        // =====================================================
        // ADMIN
        // =====================================================

        if (principalType == "Admin")
        {
            if (!int.TryParse(userId, out var adminId))
            {
                return Unauthorized();
            }

            var admin = await _db.Admins
                .FirstOrDefaultAsync(a =>
                    a.AdminID == adminId);

            if (admin == null)
            {
                return Unauthorized();
            }

            return Ok(new
            {
                AdminID = admin.AdminID,
                Email = admin.Email,
                FullName = admin.FullName,
                Role = admin.Role,
                PrincipalType = "Admin"
            });
        }

        // =====================================================
        // PHYSICIAN
        // =====================================================

        if (principalType == "Physician")
        {
            if (!int.TryParse(userId, out var physicianId))
            {
                return Unauthorized();
            }

            var physician = await _db.Physicians
                .FirstOrDefaultAsync(p =>
                    p.PhysicianID == physicianId);

            if (physician == null)
            {
                return Unauthorized();
            }

            return Ok(new
            {
                PhysicianID = physician.PhysicianID,
                Email = physician.Email,
                FullName =
                    $"{physician.FirstName} " +
                    $"{physician.MiddleName} " +
                    $"{physician.Surname}",
                Role = Roles.Physician,
                PrincipalType = "Physician",
                MustChangePassword = physician.MustChangePassword
            });
        }

        return Unauthorized();
    }

    // =========================================================
    // CHANGE PASSWORD (PHYSICIAN)
    // =========================================================

    [Authorize]
    [HttpPost("physician/change-password")]
    public async Task<IActionResult> ChangePhysicianPassword(
        ChangePasswordRequest request)
    {
        // -----------------------------------------------------
        // Must be a physician principal
        // -----------------------------------------------------

        var principalType =
            User.FindFirst("PrincipalType")?.Value;

        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (principalType != "Physician" ||
            string.IsNullOrWhiteSpace(userId) ||
            !int.TryParse(userId, out var physicianId))
        {
            return Unauthorized();
        }

        // -----------------------------------------------------
        // Validate request
        // -----------------------------------------------------

        if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
            string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new
            {
                message = "Current password and new password are required."
            });
        }

        if (request.NewPassword.Length < 8)
        {
            return BadRequest(new
            {
                message = "New password must be at least 8 characters long."
            });
        }

        if (request.NewPassword == request.CurrentPassword)
        {
            return BadRequest(new
            {
                message = "New password must be different from the current password."
            });
        }

        // -----------------------------------------------------
        // Load the physician
        // -----------------------------------------------------

        var physician = await _db.Physicians
            .FirstOrDefaultAsync(p => p.PhysicianID == physicianId);

        if (physician == null)
        {
            return Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(physician.PasswordHash))
        {
            return Unauthorized(new
            {
                message = "This physician account does not have portal access."
            });
        }

        if (!physician.IsActive)
        {
            return Unauthorized(new
            {
                message = "Account is inactive."
            });
        }

        // -----------------------------------------------------
        // Verify current password
        // -----------------------------------------------------

        var passwordResult =
            _physicianPasswordHasher.VerifyHashedPassword(
                physician,
                physician.PasswordHash,
                request.CurrentPassword
            );

        if (passwordResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new
            {
                message = "Current password is incorrect."
            });
        }

        // -----------------------------------------------------
        // Set the new password
        // -----------------------------------------------------

        physician.PasswordHash =
            _physicianPasswordHasher.HashPassword(physician, request.NewPassword);

        // password has now been chosen by the physician themselves, so the
        // forced-reset screen no longer applies
        physician.MustChangePassword = false;

        physician.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Password changed successfully."
        });
    }

    // =========================================================
    // LOGOUT
    // =========================================================

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        // -----------------------------------------------------
        // Extract the bearer token so we can find its session
        // -----------------------------------------------------

        var authHeader = Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(authHeader) ||
            !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized();
        }

        var token = authHeader["Bearer ".Length..].Trim();
        var tokenHash = HashToken(token);

        // -----------------------------------------------------
        // Revoke the matching, still-live session
        // -----------------------------------------------------

        var session = await _db.UserSessions
            .FirstOrDefaultAsync(s =>
                s.TokenHash == tokenHash &&
                s.RevokedAt == null);

        if (session != null)
        {
            session.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return Ok(new
        {
            message = "Logged out successfully."
        });
    }

    // =========================================================
    // TOKEN HASH
    // =========================================================

    private static string HashToken(string token)
    {
        using var sha256 =
            System.Security.Cryptography.SHA256.Create();

        var bytes =
            sha256.ComputeHash(
                System.Text.Encoding.UTF8.GetBytes(token)
            );

        return Convert.ToHexString(bytes)
            .ToLowerInvariant();
    }
}
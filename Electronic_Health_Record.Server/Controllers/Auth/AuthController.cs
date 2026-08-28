
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Auth;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;

namespace Electronic_Health_Record.Server.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ElectronicHealthRecordDbContext _db;
    private readonly TokenService _tokenService;

    private readonly PasswordHasher<Admin> _passwordHasher = new();

    public AuthController(
        ElectronicHealthRecordDbContext db,
        TokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<LoginResponse>> Register(
        RegisterRequest request)
    {
        // Check if email already exists
        if (await _db.Admins.AnyAsync(a => a.Email == request.Email))
        {
            return Conflict("Email already taken.");
        }

        // Check if username already exists
        if (await _db.Admins.AnyAsync(a => a.Username == request.Username))
        {
            return Conflict("Username already taken.");
        }

        // Create admin
        var admin = new Admin
        {
            FullName = request.FullName,
            Username = request.Username,
            Email = request.Email,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Hash password
        admin.PasswordHash = _passwordHasher.HashPassword(
            admin,
            request.Password
        );

        // Save admin first so AdminID is generated
        _db.Admins.Add(admin);
        await _db.SaveChangesAsync();

        // Generate JWT
        var (token, expiresAt) =
            _tokenService.GenerateToken(admin);

        // Hash JWT before storing it in AdminSession
        var tokenHash = HashToken(token);

        // Create admin session
        var session = new AdminSession
        {
            AdminID = admin.AdminID,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt
        };

        // Save session
        _db.AdminSessions.Add(session);
        await _db.SaveChangesAsync();

        // Return response
        return Ok(new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            AdminID = admin.AdminID,
            Username = admin.Username,
            
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request)
    {
        var admin = await _db.Admins
            .FirstOrDefaultAsync(a => a.Email == request.Email);

        if (admin == null)
            return Unauthorized(new { message = "Invalid email or password." });

        if (!admin.IsActive)
            return Unauthorized(new { message = "Account is inactive." });

        // Verify password
        var passwordResult = _passwordHasher.VerifyHashedPassword(
            admin,
            admin.PasswordHash,
            request.Password
        );

        if (passwordResult == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Invalid email or password." });

        // Generate JWT
        var (token, expiresAt) =
            _tokenService.GenerateToken(admin);

        // Hash JWT for database storage
        var tokenHash = HashToken(token);

        // Create session
        var session = new AdminSession
        {
            AdminID = admin.AdminID,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            CreatedAt = DateTime.UtcNow
        };

        _db.AdminSessions.Add(session);

        // Update last login
        admin.LastLoginAt = DateTime.UtcNow;
        admin.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Return ORIGINAL JWT to frontend
        return Ok(new LoginResponse
        {
            Token = token,
            ExpiresAt = expiresAt,
            AdminID = admin.AdminID,
            Username = admin.Username,
            FullName = admin.FullName
        });
    }


    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            Username = User.FindFirst(ClaimTypes.Name)?.Value,
            FullName = User.FindFirst("FullName")?.Value
        });
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(
            Encoding.UTF8.GetBytes(token)
        );

        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var authHeader = Request.Headers.Authorization.ToString();

        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return Unauthorized(new { message = "Token is missing." });

        var token = authHeader["Bearer ".Length..].Trim();
        var tokenHash = HashToken(token);

        var session = await _db.AdminSessions
            .AsTracking()   // ensure EF tracks this entity for the update
            .FirstOrDefaultAsync(s => s.TokenHash == tokenHash);

        if (session == null)
            return NotFound(new { message = "Session not found." });

        if (session.RevokedAt != null)
            return Ok(new { message = "Already logged out." });

        session.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Logged out successfully." });
    }
}


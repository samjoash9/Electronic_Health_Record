using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.DTOs.Auth;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using System.Numerics;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using static System.Net.Mime.MediaTypeNames;
using static System.Net.WebRequestMethods;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Electronic_Health_Record.Server.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ElectronicHealthRecordDbContext _db;
    private readonly TokenService _tokenService;

    private readonly PasswordHasher<Admin> _adminPasswordHasher = new();
    private readonly PasswordHasher<Physician> _physicianPasswordHasher = new();
    private readonly PasswordHasher<PatientAccount> _patientPasswordHasher = new();

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
        [FromBody] LoginRequest request)
    {
        // ---------------------------------------------------------
        // Validate request
        // ---------------------------------------------------------

        if (request == null ||
            string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Username and password are required."
            });
        }

        var username = request.Username.Trim();


        // =========================================================
        // 1. ADMIN
        // =========================================================

        var admin = await _db.Admins
            .FirstOrDefaultAsync(a => a.Username == username);

        if (admin != null)
        {
            // -----------------------------------------------------
            // Account status
            // -----------------------------------------------------

            if (!admin.IsActive)
            {
                return Unauthorized(new
                {
                    message = "Account is inactive."
                });
            }

            // -----------------------------------------------------
            // Validate role
            // -----------------------------------------------------

            if (!AdminRoles.IsValid(admin.Role))
            {
                return Unauthorized(new
                {
                    message = "Invalid account role."
                });
            }

            // -----------------------------------------------------
            // Verify password
            // -----------------------------------------------------

            var passwordResult =
                _adminPasswordHasher.VerifyHashedPassword(
                    admin,
                    admin.PasswordHash,
                    request.Password
                );

            if (passwordResult ==
                PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            // -----------------------------------------------------
            // Rehash password if required
            // -----------------------------------------------------

            if (passwordResult ==
                PasswordVerificationResult.SuccessRehashNeeded)
            {
                admin.PasswordHash =
                    _adminPasswordHasher.HashPassword(
                        admin,
                        request.Password
                    );
            }

            // -----------------------------------------------------
            // Update login information
            // -----------------------------------------------------

            admin.LastLoginAt = DateTime.UtcNow;
            admin.UpdatedAt = DateTime.UtcNow;

            // -----------------------------------------------------
            // Generate JWT + AdminSession
            // -----------------------------------------------------

            var (token, expiresAt) =
                await _tokenService.GenerateTokenAsync(admin);

            await _db.SaveChangesAsync();

            // -----------------------------------------------------
            // Response
            // -----------------------------------------------------

            return Ok(new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,

                AccountId = admin.AdminID,
                Username = admin.Username,

                FullName = admin.FullName,

                AccountType = "Admin",

                Role = admin.Role
            });
        }


        // =========================================================
        // 2. PHYSICIAN
        // =========================================================

        var physician = await _db.Physicians
            .FirstOrDefaultAsync(p => p.Username == username);

        if (physician != null)
        {
            // -----------------------------------------------------
            // Portal access
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                physician.PasswordHash))
            {
                return Unauthorized(new
                {
                    message =
                        "This physician account does not have portal access."
                });
            }

            // -----------------------------------------------------
            // Account status
            // -----------------------------------------------------

            if (!physician.IsActive)
            {
                return Unauthorized(new
                {
                    message = "Account is inactive."
                });
            }

            // -----------------------------------------------------
            // Verify password
            // -----------------------------------------------------

            var passwordResult =
                _physicianPasswordHasher.VerifyHashedPassword(
                    physician,
                    physician.PasswordHash,
                    request.Password
                );

            if (passwordResult ==
                PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid username or password."
                });
            }

            // -----------------------------------------------------
            // Rehash password if required
            // -----------------------------------------------------

            if (passwordResult ==
                PasswordVerificationResult.SuccessRehashNeeded)
            {
                physician.PasswordHash =
                    _physicianPasswordHasher.HashPassword(
                        physician,
                        request.Password
                    );
            }

            // -----------------------------------------------------
            // Update login information
            // -----------------------------------------------------

            physician.LastLoginAt = DateTime.UtcNow;
            physician.UpdatedAt = DateTime.UtcNow;

            // -----------------------------------------------------
            // Generate JWT + PhysicianSession
            // -----------------------------------------------------

            var (token, expiresAt) =
                await _tokenService.GenerateTokenAsync(
                    physician
                );

            await _db.SaveChangesAsync();

            // -----------------------------------------------------
            // Response
            // -----------------------------------------------------

            return Ok(new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,

                AccountId = physician.PhysicianID,
                Username = physician.Username,

                FullName = BuildPhysicianFullName(
                    physician
                ),

                AccountType = "Physician"
            });
        }


        // =========================================================
        // 3. PATIENT
        // =========================================================

        var patientAccount = await _db.PatientAccounts
            .FirstOrDefaultAsync(a =>
                a.Username == username);

        if (patientAccount != null)
        {
            // -----------------------------------------------------
            // Account status
            // -----------------------------------------------------

            if (!string.Equals(
                patientAccount.Status,
                "Active",
                StringComparison.OrdinalIgnoreCase))
            {
                return Unauthorized(new
                {
                    message =
                        "Patient account is not active."
                });
            }

            // -----------------------------------------------------
            // Password exists
            // -----------------------------------------------------

            if (string.IsNullOrWhiteSpace(
                patientAccount.PasswordHash))
            {
                return Unauthorized(new
                {
                    message =
                        "Patient account has no password."
                });
            }

            // -----------------------------------------------------
            // Load patient
            // -----------------------------------------------------

            var patient = await _db.Patients
                .FirstOrDefaultAsync(p =>
                    p.PatientID ==
                    patientAccount.PatientID);

            if (patient == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Patient record was not found."
                });
            }

            // -----------------------------------------------------
            // Verify password
            // -----------------------------------------------------

            var passwordResult =
                _patientPasswordHasher.VerifyHashedPassword(
                    patientAccount,
                    patientAccount.PasswordHash,
                    request.Password
                );

            if (passwordResult ==
                PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid username or password."
                });
            }

            // -----------------------------------------------------
            // Rehash password if required
            // -----------------------------------------------------

            if (passwordResult ==
                PasswordVerificationResult.SuccessRehashNeeded)
            {
                patientAccount.PasswordHash =
                    _patientPasswordHasher.HashPassword(
                        patientAccount,
                        request.Password
                    );
            }

            // -----------------------------------------------------
            // Update account
            // -----------------------------------------------------

            patientAccount.UpdatedAt = DateTime.UtcNow;

            // -----------------------------------------------------
            // Generate JWT + PatientSession
            // -----------------------------------------------------

            var (token, expiresAt) =
                await _tokenService.GenerateTokenAsync(
                    patientAccount,
                    patient
                );

            await _db.SaveChangesAsync();

            // -----------------------------------------------------
            // Response
            // -----------------------------------------------------

            return Ok(new LoginResponse
            {
                Token = token,
                ExpiresAt = expiresAt,

                AccountId =
                    patientAccount.PatientAccountID,

                Username =
                    patientAccount.Username,

                FullName =
                    BuildPatientFullName(patient),

                AccountType = "Patient"
            });
        }


        // =========================================================
        // NO ACCOUNT FOUND
        // =========================================================

        return Unauthorized(new
        {
            message = "Invalid username or password."
        });
    }


    // =========================================================
    // ME
    // =========================================================

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<MeResponse>> Me()
    {
        var principalType =
            User.FindFirstValue("PrincipalType");

        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(principalType) ||
            string.IsNullOrWhiteSpace(userIdValue) ||
            !int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid token."
            });
        }


        // =========================================================
        // ADMIN
        // =========================================================

        switch (principalType)
        {
            case "Admin":
                {
                    var admin = await _db.Admins
                        .FirstOrDefaultAsync(a =>
                            a.AdminID == userId);

                    if (admin == null ||
                        !admin.IsActive)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "Account no longer active."
                        });
                    }

                    return Ok(new MeResponse
                    {
                        FullName = admin.FullName,
                        Username = admin.Username,
                        AccountType = "Admin",

                        Role = admin.Role
                    });
                }


            // =====================================================
            // PHYSICIAN
            // =====================================================

            case "Physician":
                {
                    var physician = await _db.Physicians
                        .FirstOrDefaultAsync(p =>
                            p.PhysicianID == userId);

                    if (physician == null ||
                        !physician.IsActive)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "Account no longer active."
                        });
                    }

                    return Ok(new MeResponse
                    {
                        FullName =
                            BuildPhysicianFullName(
                                physician
                            ),

                        Username =
                            physician.Username,

                        AccountType = "Physician"
                    });
                }


            // =====================================================
            // PATIENT
            // =====================================================

            case "Patient":
                {
                    var patientAccount =
                        await _db.PatientAccounts
                            .FirstOrDefaultAsync(a =>
                                a.PatientAccountID == userId);

                    if (patientAccount == null ||
                        !string.Equals(
                            patientAccount.Status,
                            "Active",
                            StringComparison.OrdinalIgnoreCase))
                    {
                        return Unauthorized(new
                        {
                            message =
                                "Account no longer active."
                        });
                    }

                    var patient =
                        await _db.Patients
                            .FirstOrDefaultAsync(p =>
                                p.PatientID ==
                                patientAccount.PatientID);

                    if (patient == null)
                    {
                        return Unauthorized(new
                        {
                            message =
                                "Patient record was not found."
                        });
                    }

                    return Ok(new MeResponse
                    {
                        FullName =
                            BuildPatientFullName(patient),

                        Username =
                            patientAccount.Username,

                        AccountType = "Patient",

                        Employee =
                            patient.ExternalEmployeeId
                    });
                }


            // =====================================================
            // UNKNOWN PRINCIPAL TYPE
            // =====================================================

            default:
                return Unauthorized(new
                {
                    message =
                        "Unrecognized account type."
                });
        }
    }


    // =========================================================
    // LOGOUT
    // =========================================================
    //
    // POST /api/Auth/logout
    //
    // Authorization:
    // Bearer <JWT>
    //
    // The JWT is hashed and matched against the session table.
    //
    // Admin      -> AdminSessions
    // Physician  -> PhysicianSessions
    // Patient    -> PatientSessions
    //
    // RevokedAt is set to the current UTC time.
    // =========================================================

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        // ---------------------------------------------------------
        // Get PrincipalType
        // ---------------------------------------------------------

        var principalType =
            User.FindFirstValue("PrincipalType");

        if (string.IsNullOrWhiteSpace(principalType))
        {
            return Unauthorized(new
            {
                message = "Invalid token."
            });
        }


        // ---------------------------------------------------------
        // Get Authorization header
        // ---------------------------------------------------------

        var authorizationHeader =
            Request.Headers.Authorization.ToString();

        if (string.IsNullOrWhiteSpace(authorizationHeader) ||
            !authorizationHeader.StartsWith(
                "Bearer ",
                StringComparison.OrdinalIgnoreCase))
        {
            return Unauthorized(new
            {
                message = "Bearer token is required."
            });
        }


        // ---------------------------------------------------------
        // Extract JWT
        // ---------------------------------------------------------

        var token =
            authorizationHeader["Bearer ".Length..].Trim();

        if (string.IsNullOrWhiteSpace(token))
        {
            return Unauthorized(new
            {
                message = "Invalid token."
            });
        }


        // ---------------------------------------------------------
        // Hash JWT
        // ---------------------------------------------------------

        var tokenHash = HashToken(token);

        var now = DateTime.UtcNow;


        // =========================================================
        // ADMIN
        // =========================================================

        if (principalType == "Admin")
        {
            var session =
                await _db.AdminSessions
                    .FirstOrDefaultAsync(s =>
                        s.TokenHash == tokenHash &&
                        s.RevokedAt == null);

            if (session == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Session not found or already revoked."
                });
            }

            session.RevokedAt = now;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Logged out successfully.",
                revokedAt = session.RevokedAt
            });
        }


        // =========================================================
        // PHYSICIAN
        // =========================================================

        if (principalType == "Physician")
        {
            var session =
                await _db.PhysicianSessions
                    .FirstOrDefaultAsync(s =>
                        s.TokenHash == tokenHash &&
                        s.RevokedAt == null);

            if (session == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Session not found or already revoked."
                });
            }

            session.RevokedAt = now;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Logged out successfully.",
                revokedAt = session.RevokedAt
            });
        }


        // =========================================================
        // PATIENT
        // =========================================================

        if (principalType == "Patient")
        {
            var session =
                await _db.PatientSessions
                    .FirstOrDefaultAsync(s =>
                        s.TokenHash == tokenHash &&
                        s.RevokedAt == null);

            if (session == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Session not found or already revoked."
                });
            }

            session.RevokedAt = now;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Logged out successfully.",
                revokedAt = session.RevokedAt
            });
        }


        // =========================================================
        // UNKNOWN PRINCIPAL TYPE
        // =========================================================

        return Unauthorized(new
        {
            message =
                "Unrecognized account type."
        });
    }


    // =========================================================
    // TOKEN HASH
    // =========================================================

    private static string HashToken(string token)
    {
        var bytes =
            SHA256.HashData(
                Encoding.UTF8.GetBytes(token)
            );

        return Convert.ToHexString(bytes)
            .ToLowerInvariant();
    }


    // =========================================================
    // PHYSICIAN FULL NAME
    // =========================================================

    private static string BuildPhysicianFullName(
        Physician physician)
    {
        var parts = new[]
        {
            physician.FirstName,
            physician.MiddleName,
            physician.Surname
        };

        return string.Join(
            " ",
            parts.Where(x =>
                !string.IsNullOrWhiteSpace(x))
        );
    }


    // =========================================================
    // PATIENT FULL NAME
    // =========================================================

    private static string BuildPatientFullName(
        Patient patient)
    {
        var parts = new[]
        {
            patient.FirstName,
            patient.MiddleName,
            patient.Surname
        };

        return string.Join(
            " ",
            parts.Where(x =>
                !string.IsNullOrWhiteSpace(x))
        );
    }
}

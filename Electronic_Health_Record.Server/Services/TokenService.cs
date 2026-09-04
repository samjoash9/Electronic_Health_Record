
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

using Electronic_Health_Record.Server.Data;
using Electronic_Health_Record.Server.Models;

using Microsoft.IdentityModel.Tokens;

namespace Electronic_Health_Record.Server.Services;

public class TokenService
{
    private readonly IConfiguration _config;
    private readonly ElectronicHealthRecordDbContext _context;

    public TokenService(
        IConfiguration config,
        ElectronicHealthRecordDbContext context)
    {
        _config = config;
        _context = context;
    }


    // =========================================================
    // ADMIN TOKEN
    // =========================================================
    //
    // Admin has two permission levels:
    //
    //     admin
    //     superadmin
    //
    // Role is therefore stored in the JWT.
    // =========================================================

    public async Task<(string token, DateTime expiresAt)>
        GenerateTokenAsync(Admin admin)
    {
        var result = GenerateToken(
            userId: admin.AdminID,
            username: admin.Username,
            fullName: admin.FullName,
            role: admin.Role,
            principalType: "Admin"
        );

        // ---------------------------------------------------------
        // Store Admin Session
        // ---------------------------------------------------------

        var session = new AdminSession
        {
            AdminID = admin.AdminID,
            TokenHash = HashToken(result.token),
            ExpiresAt = result.expiresAt
        };

        _context.AdminSessions.Add(session);

        await _context.SaveChangesAsync();

        return result;
    }


    // =========================================================
    // PHYSICIAN TOKEN
    // =========================================================
    //
    // Physician table DOES NOT have a Role column.
    //
    // Therefore:
    //
    //     Role = null
    //     PrincipalType = Physician
    //
    // Authorization for Physician can use:
    //
    //     [Authorize]
    //
    // together with PrincipalType checks.
    // =========================================================

    public async Task<(string token, DateTime expiresAt)>
        GenerateTokenAsync(Physician physician)
    {
        var result = GenerateToken(
            userId: physician.PhysicianID,
            username: physician.Username,
            fullName: BuildPhysicianFullName(physician),
            role: null,
            principalType: "Physician"
        );

        // ---------------------------------------------------------
        // Store Physician Session
        // ---------------------------------------------------------

        var session = new PhysicianSession
        {
            PhysicianID = physician.PhysicianID,
            TokenHash = HashToken(result.token),
            ExpiresAt = result.expiresAt
        };

        _context.PhysicianSessions.Add(session);

        await _context.SaveChangesAsync();

        return result;
    }


    // =========================================================
    // PATIENT TOKEN
    // =========================================================
    //
    // Patient also does not need an application role.
    //
    // PrincipalType identifies the authenticated account:
    //
    //     Patient
    // =========================================================

    public async Task<(string token, DateTime expiresAt)>
        GenerateTokenAsync(
            PatientAccount patientAccount,
            Patient patient)
    {
        var result = GenerateToken(
            userId: patientAccount.PatientAccountID,
            username: patientAccount.Username,
            fullName: BuildPatientFullName(patient),
            role: null,
            principalType: "Patient"
        );

        // ---------------------------------------------------------
        // Store Patient Session
        // ---------------------------------------------------------

        var session = new PatientSession
        {
            PatientAccountID =
                patientAccount.PatientAccountID,

            TokenHash =
                HashToken(result.token),

            ExpiresAt =
                result.expiresAt
        };

        _context.PatientSessions.Add(session);

        await _context.SaveChangesAsync();

        return result;
    }


    // =========================================================
    // COMMON JWT GENERATION
    // =========================================================

    private (string token, DateTime expiresAt)
        GenerateToken(
            int userId,
            string username,
            string fullName,
            string? role,
            string principalType)
    {
        var jwtSection = _config.GetSection("Jwt");


        // =========================================================
        // JWT CONFIGURATION
        // =========================================================

        var keyValue = jwtSection["Key"];

        if (string.IsNullOrWhiteSpace(keyValue))
        {
            throw new InvalidOperationException(
                "JWT configuration error: 'Jwt:Key' is missing."
            );
        }

        var issuer = jwtSection["Issuer"];

        if (string.IsNullOrWhiteSpace(issuer))
        {
            throw new InvalidOperationException(
                "JWT configuration error: 'Jwt:Issuer' is missing."
            );
        }

        var audience = jwtSection["Audience"];

        if (string.IsNullOrWhiteSpace(audience))
        {
            throw new InvalidOperationException(
                "JWT configuration error: 'Jwt:Audience' is missing."
            );
        }

        if (!double.TryParse(
            jwtSection["ExpiresInMinutes"],
            out var expiresInMinutes))
        {
            throw new InvalidOperationException(
                "JWT configuration error: 'Jwt:ExpiresInMinutes' is invalid."
            );
        }


        // =========================================================
        // SIGNING KEY
        // =========================================================

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(keyValue)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );


        // =========================================================
        // UNIQUE TOKEN ID
        // =========================================================

        var jti = Guid.NewGuid().ToString();


        // =========================================================
        // BASE CLAIMS
        // =========================================================

        var claims = new List<Claim>
        {
            // Account ID
            //
            // Admin:
            //     AdminID
            //
            // Physician:
            //     PhysicianID
            //
            // Patient:
            //     PatientAccountID
            new(
                ClaimTypes.NameIdentifier,
                userId.ToString()
            ),

            // Username
            new(
                ClaimTypes.Name,
                username
            ),

            // Identifies the account type/table
            //
            // Admin
            // Physician
            // Patient
            new(
                "PrincipalType",
                principalType
            ),

            // Full name
            new(
                "FullName",
                fullName
            ),

            // Unique JWT/session identifier
            new(
                JwtRegisteredClaimNames.Jti,
                jti
            )
        };


        // =========================================================
        // ADMIN ROLE
        // =========================================================
        //
        // Only Admin has a Role.
        //
        // Physician and Patient do not receive a Role claim.
        // =========================================================

        if (!string.IsNullOrWhiteSpace(role))
        {
            claims.Add(
                new Claim(
                    ClaimTypes.Role,
                    role
                )
            );
        }


        // =========================================================
        // EXPIRATION
        // =========================================================

        var expiresAt =
            DateTime.UtcNow.AddMinutes(
                expiresInMinutes
            );


        // =========================================================
        // CREATE JWT
        // =========================================================

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );


        // =========================================================
        // SERIALIZE TOKEN
        // =========================================================

        var tokenString =
            new JwtSecurityTokenHandler()
                .WriteToken(token);


        return (
            tokenString,
            expiresAt
        );
    }


    // =========================================================
    // HASH TOKEN
    // =========================================================
    //
    // The raw JWT is NEVER stored in the database.
    //
    // Session table stores:
    //
    //     SHA256(JWT)
    //
    // =========================================================

    public static string HashToken(string token)
    {
        var bytes = SHA256.HashData(
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
            parts.Where(
                x => !string.IsNullOrWhiteSpace(x))
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
            parts.Where(
                x => !string.IsNullOrWhiteSpace(x))
        );
    }
}

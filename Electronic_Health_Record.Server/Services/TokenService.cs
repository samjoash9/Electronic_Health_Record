using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using Electronic_Health_Record.Server.Models;

using Microsoft.IdentityModel.Tokens;

namespace Electronic_Health_Record.Server.Services;

public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    // =========================================================
    // ADMIN TOKEN
    // =========================================================

    public (string token, DateTime expiresAt) GenerateToken(Admin admin)
    {
        return GenerateToken(
            userId: admin.AdminID,
            username: admin.Username,
            email: admin.Email,
            fullName: admin.FullName,
            role: admin.Role,
            principalType: "Admin"
        );
    }


    // =========================================================
    // PHYSICIAN TOKEN
    // =========================================================

    public (string token, DateTime expiresAt) GenerateToken(Physician physician)
    {
        return GenerateToken(
            userId: physician.PhysicianID,
            username: physician.Username!,
            email: physician.Email!,
            fullName: BuildPhysicianFullName(physician),
            role: Roles.Physician,
            principalType: "Physician"
        );
    }


    // =========================================================
    // COMMON TOKEN GENERATION
    // =========================================================

    private (string token, DateTime expiresAt) GenerateToken(
        int userId,
        string username,
        string email,
        string fullName,
        string role,
        string principalType)
    {
        var jwtSection = _config.GetSection("Jwt");

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSection["Key"]!)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var claims = new List<Claim>
        {
            new(
                ClaimTypes.NameIdentifier,
                userId.ToString()
            ),

            new(
                ClaimTypes.Name,
                username
            ),

            new(
                ClaimTypes.Email,
                email
            ),

            new(
                "FullName",
                fullName
            ),

            // IMPORTANT FOR RBAC
            new(
                ClaimTypes.Role,
                role
            ),

            // Tells us which table/principal this belongs to
            new(
                "PrincipalType",
                principalType
            ),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString()
            )
        };

        var expiresAt = DateTime.UtcNow.AddMinutes(
            double.Parse(jwtSection["ExpiresInMinutes"]!)
        );

        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        var tokenString = new JwtSecurityTokenHandler()
            .WriteToken(token);

        return (tokenString, expiresAt);
    }


    // =========================================================
    // PHYSICIAN FULL NAME
    // =========================================================

    private static string BuildPhysicianFullName(
        Physician physician)
    {
        if (string.IsNullOrWhiteSpace(physician.MiddleName))
        {
            return $"{physician.FirstName} {physician.Surname}";
        }

        return $"{physician.FirstName} {physician.MiddleName} {physician.Surname}";
    }
}
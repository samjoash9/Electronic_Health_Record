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

    public (string token, DateTime expiresAt) GenerateToken(Admin admin)
    {
        // Get JWT settings from appsettings.json
        var jwtSection = _config.GetSection("Jwt");

        // Create signing key
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSection["Key"]!)
        );

        // Create signing credentials
        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        // Create claims
        var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, admin.AdminID.ToString()),
                new(ClaimTypes.Name, admin.Username),
                new("FullName", admin.FullName),
                new(ClaimTypes.Email, admin.Email),
                new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

        // Calculate expiration
        var expiresAt = DateTime.UtcNow.AddMinutes(
            double.Parse(jwtSection["ExpiresInMinutes"]!)
        );

        // Create JWT
        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        // Convert JWT to string
        var tokenString = new JwtSecurityTokenHandler()
            .WriteToken(token);

        return (tokenString, expiresAt);
    }
}
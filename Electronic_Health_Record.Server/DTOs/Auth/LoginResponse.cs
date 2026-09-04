
namespace Electronic_Health_Record.Server.DTOs.Auth
{
    public class LoginResponse
    {
        // JWT access token
        public string Token { get; set; } = string.Empty;

        // JWT expiration time
        public DateTime ExpiresAt { get; set; }

        // ID of the authenticated account
        //
        // Admin     -> AdminID
        // Physician -> PhysicianID
        // Patient   -> PatientAccountID
        public int AccountId { get; set; }

        // Login username
        public string Username { get; set; } = string.Empty;

        // Display name
        public string FullName { get; set; } = string.Empty;

        // Admin / Physician / Patient
        public string AccountType { get; set; } = string.Empty;

        // Admin only:
        //     admin
        //     superadmin
        //
        // Physician / Patient:
        //     null
        public string? Role { get; set; }
    }
}


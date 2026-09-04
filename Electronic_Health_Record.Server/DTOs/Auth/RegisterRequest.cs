namespace Electronic_Health_Record.Server.DTOs.Auth
{
    public class RegisterRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Admin, Physician, or Patient
        public string AccountType { get; set; } = string.Empty;

        // Only applicable to Admin:
        // admin or superadmin
        public string? Role { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string? ContactNo { get; set; }
    }
}

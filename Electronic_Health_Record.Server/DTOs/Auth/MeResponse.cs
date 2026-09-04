namespace Electronic_Health_Record.Server.DTOs.Auth
{
    public class MeResponse
    {
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;

        // Admin / Physician / Patient
        public string AccountType { get; set; } = string.Empty;

        // Admin only: "admin" or "superadmin". Null for Physician/Patient.
        public string? Role { get; set; }

        // Patient only: the employee ID from the HR sync (Patient.ExternalEmployeeId).
        // Null for Admin/Physician.
        public string? Employee { get; set; }
    }
}
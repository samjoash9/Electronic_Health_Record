namespace Electronic_Health_Record.Server.Models
{
    public class Admin
    {
        public int AdminID { get; set; }
        public string Username { get; set; } = string.Empty;
        // Permission tier within the Admin table: "admin" (hospital staff working
        // Stations 1-2) or "superadmin". Distinct from the session's role field,
        // which says which table the account authenticated against.
        public string Role { get; set; } = AdminRoles.Admin;
        public string? ContactNo { get; set; }
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
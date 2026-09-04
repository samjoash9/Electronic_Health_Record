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
        // true while the account is still on the password whoever created it handed
        // out. Onboarding and admin resets set it back to true; changing the password
        // clears it.
        public bool MustChangePassword { get; set; } = true;
        // When the default password was issued. Lets an unclaimed account be expired
        // without guessing from CreatedAt, which never moves on a reset.
        public DateTime? PasswordSetAt { get; set; }
        // Last time the account holder chose their own password. null means they
        // never have.
        public DateTime? PasswordChangedAt { get; set; }
        public string FullName { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
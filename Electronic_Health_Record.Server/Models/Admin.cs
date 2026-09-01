namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// A staff account: either a SuperAdmin (developer) or an Admin (interviews patients,
    /// fills wellness forms, chooses the signing physician). Physicians are NOT stored here --
    /// they have their own table with their own credentials.
    /// </summary>
    public class Admin
    {
        public int AdminID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        // The hash is self-describing, so no companion "algorithm" column is needed:
        //   64 lowercase hex chars  -> legacy unsalted SHA-256 (what DbSeeder writes)
        //   84-char Base64 "AQAAAA..." -> PBKDF2, via ASP.NET's PasswordHasher<T>
        // Login can therefore verify a legacy hash and rewrite it as PBKDF2 in place.
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        // "SuperAdmin" or "Admin" -- see Roles. CK_Admin_Role rejects anything else,
        // which is what stops a staff account from ever being able to sign.
        public string Role { get; set; } = Roles.Admin;
        public bool IsActive { get; set; } = true;
        // set on a provisioned account so the first login lands on a forced-reset screen
        public bool MustChangePassword { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

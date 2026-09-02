namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// A licensed physician. Two things at once, deliberately:
    /// a directory entry (name + PRC licence, created by an Admin from the Doctors page), and
    /// optionally a login account. The credential columns are null until a SuperAdmin grants
    /// portal access, so existing directory rows stay valid; CK_Physician_CredentialSet keeps
    /// them all-or-nothing. A physician with no credentials can be assigned a form but cannot sign it.
    /// </summary>
    public class Physician
    {
        public int PhysicianID { get; set; }
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string PRCLicenseNo { get; set; } = string.Empty;

        // --- credentials: all null (directory-only row) or all set (has portal access) ---
        public string? Email { get; set; }
        // self-describing, as on Admin.PasswordHash: 64 lowercase hex = legacy SHA-256,
        // 84-char Base64 "AQAAAA..." = PBKDF2
        public string? PasswordHash { get; set; }
        public bool IsActive { get; set; } = true;
        // set on a provisioned account so the first login lands on a forced-reset screen
        public bool MustChangePassword { get; set; }
        public DateTime? LastLoginAt { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

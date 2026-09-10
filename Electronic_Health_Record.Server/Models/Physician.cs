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
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        // true while the doctor is still on the password the admin handed out at
        // onboarding. Admin resets set it back to true; changing it clears it.
        public bool MustChangePassword { get; set; } = true;
        // When the default password was issued. Lets an unclaimed account be expired
        // without guessing from CreatedAt, which never moves on a reset.
        public DateTime? PasswordSetAt { get; set; }
        // Last time the doctor chose their own password. null means they never have.
        public DateTime? PasswordChangedAt { get; set; }
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string PRCLicenseNo { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

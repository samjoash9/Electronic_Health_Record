namespace Electronic_Health_Record.Server.Models
{
    public class PatientAccount
    {
        public int PatientAccountID { get; set; }
        public int PatientID { get; set; }
        // Login handle, issued by Station 1 when the account is provisioned.
        // Lives here rather than on Patient so an HR API resync can never
        // overwrite a credential.
        public string Username { get; set; } = string.Empty;
        // null until the patient activates the account and sets a password
        public string? PasswordHash { get; set; }
        // true while the patient is still on a password an admin handed them. Unlike
        // Admin and Physician this defaults to false, because a freshly provisioned
        // account has no password at all yet -- there is nothing to rotate until an
        // admin issues a default or resets an existing one.
        public bool MustChangePassword { get; set; }
        // When the default password was issued. Stays null for an account that has
        // only ever been provisioned.
        public DateTime? PasswordSetAt { get; set; }
        // Last time the patient chose their own password. null means they never have.
        public DateTime? PasswordChangedAt { get; set; }
        // "Provisioned" | "Active" | "Disabled"
        public string Status { get; set; } = "Provisioned";
        public DateTime ProvisionedAt { get; set; }
        public DateTime? ActivatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

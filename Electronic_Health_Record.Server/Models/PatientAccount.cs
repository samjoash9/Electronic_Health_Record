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
        // "Provisioned" | "Active" | "Disabled"
        public string Status { get; set; } = "Provisioned";
        public DateTime ProvisionedAt { get; set; }
        public DateTime? ActivatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

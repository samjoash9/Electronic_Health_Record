namespace Electronic_Health_Record.Server.DTOs.Patient
{
    // The patient-portal credential fields an admin may read. An explicit pick
    // rather than the PatientAccount entity, which carries PasswordHash --
    // same shape of protection PhysicianResponseDto gives Physician.
    public class PatientAccountDto
    {
        public int PatientAccountID { get; set; }
        public int PatientID { get; set; }
        public string Username { get; set; } = string.Empty;
        // "Provisioned" | "Active" | "Disabled"
        public string Status { get; set; } = string.Empty;
        // true while the patient is still on the default password Station 1
        // issued them, i.e. they have never signed in and chosen their own.
        public bool MustChangePassword { get; set; }
        public DateTime ProvisionedAt { get; set; }
        public DateTime? ActivatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    // A patient plus their portal account, for the admin Patients panel.
    // Account is null for a Patient row that exists (HR sync) but has never
    // been registered at Station 1.
    public class PatientWithAccountDto
    {
        public int PatientID { get; set; }
        public string ExternalEmployeeId { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime Birthdate { get; set; }
        public string Sex { get; set; } = string.Empty;
        public string? AgencyOffice { get; set; }
        public string? Position { get; set; }
        public string? ContactNo { get; set; }
        public DateTime CreatedAt { get; set; }
        public PatientAccountDto? Account { get; set; }
    }
}

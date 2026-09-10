namespace Electronic_Health_Record.Server.Models
{
    public class Patient
    {
        public int PatientID { get; set; }
        // employee ID from the external HR API; the source of truth for identity.
        // Patient rows are only ever created by syncing from that API.
        public string ExternalEmployeeId { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public DateTime Birthdate { get; set; }
        public string Sex { get; set; } = string.Empty;
        public string CivilStatus { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? AgencyOffice { get; set; }
        public string? Position { get; set; }
        public string? ContactNo { get; set; }
        // last time this row was refreshed from the HR API
        public DateTime LastSyncedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
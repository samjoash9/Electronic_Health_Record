namespace Electronic_Health_Record.Server.Models
{
    public class Patient
    {
        public int PatientID { get; set; }
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
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
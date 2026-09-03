namespace Electronic_Health_Record.Server.DTOs.Physician
{
    public class PhysicianResponseDto
    {
        public int PhysicianID { get; set; }
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = string.Empty;
        public string PRCLicenseNo { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

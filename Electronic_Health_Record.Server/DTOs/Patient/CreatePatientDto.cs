using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Patient
{
    public class CreatePatientDto
    {
        [Required]
        [MaxLength(50)]
        public string Surname { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? MiddleName { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime Birthdate { get; set; }

        [Required]
        [RegularExpression("^[MF]$", ErrorMessage = "Sex must be 'M' or 'F'")]
        public string Sex { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string CivilStatus { get; set; } = string.Empty;

        [MaxLength(255)]
        public string? Address { get; set; }

        [MaxLength(100)]
        public string? AgencyOffice { get; set; }

        [MaxLength(50)]
        public string? Position { get; set; }

        [MaxLength(20)]
        [Phone(ErrorMessage = "Invalid contact number format")]
        public string? ContactNo { get; set; }
    }
}

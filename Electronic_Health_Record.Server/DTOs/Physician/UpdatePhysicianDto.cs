using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Physician
{
    public class UpdatePhysicianDto
    {
        [Required(ErrorMessage = "Surname is required.")]
        [MaxLength(50)]
        public string Surname { get; set; } = string.Empty;

        [Required(ErrorMessage = "First name is required.")]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? MiddleName { get; set; } = string.Empty;

        [Required(ErrorMessage = "PRC License No. is required.")]
        [MaxLength(20)]
        public string PRCLicenseNo { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? ContactNo { get; set; }
    }
}

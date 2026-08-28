using System.ComponentModel.DataAnnotations;
using System.Runtime.CompilerServices;

namespace Electronic_Health_Record.Server.DTOs.Physician
{
    public class CreatePhysicianDto
    {
        // Surname
        [Required]
        [MaxLength(50)]
        public string Surname { get; set; } = string.Empty;

        // FirstName
        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        // MiddleName
        [MaxLength(50)]
        public string MiddleName { get; set; } = string.Empty;

        // PRCLicenseNo
        [Required]
        [MaxLength(20)]
        public string PRCLicenseNo { get; set; } = string.Empty;

        // the rest are handled with db defaults
    }
}

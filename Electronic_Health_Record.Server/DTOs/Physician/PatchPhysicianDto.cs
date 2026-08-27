using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Physician
{
    public class PatchPhysicianDto
    {
        [MaxLength(50)]
        public string? Surname { get; set; }

        [MaxLength(50)]
        public string? FirstName { get; set; }

        [MaxLength(50)]
        public string? MiddleName { get; set; }

        [MaxLength(20)]
        public string? PRCLicenseNo { get; set; }
    }
}
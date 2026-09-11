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

        [MaxLength(20)]
        public string? ContactNo { get; set; }

        [Range(3, 5, ErrorMessage = "Station must be 3, 4 or 5.")]
        public int? Station { get; set; }

        // Deactivation is how a doctor account is retired: the row is referenced
        // by every form they signed, so it is never deleted.
        public bool? IsActive { get; set; }
    }
}
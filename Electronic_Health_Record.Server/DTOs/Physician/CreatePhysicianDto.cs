using System.ComponentModel.DataAnnotations;

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

        // ContactNo
        [MaxLength(20)]
        public string? ContactNo { get; set; }

        // Which desk this doctor staffs: 3 Consultation, 4 Dental, 5 Vision.
        // Required at registration -- a doctor signs in straight to their station,
        // so there is no unassigned state to fall back to.
        [Required]
        [Range(3, 5, ErrorMessage = "Station must be 3, 4 or 5.")]
        public int Station { get; set; }

        // Sign-in handle the admin issues at onboarding. Unique across the
        // Physician table (see the DbContext's index).
        [Required]
        [MaxLength(30)]
        public string Username { get; set; } = string.Empty;

        // The password the admin hands over. Stored hashed, and the account is
        // created with MustChangePassword set, so it only survives one sign-in.
        [Required]
        [MinLength(8, ErrorMessage = "Use at least 8 characters.")]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;

        // the rest are handled with db defaults
    }
}

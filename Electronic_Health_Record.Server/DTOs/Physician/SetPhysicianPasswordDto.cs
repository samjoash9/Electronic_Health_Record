using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Physician
{
    /// <summary>
    /// A replacement temporary password issued by an admin. The account is put
    /// back on MustChangePassword, so the doctor has to replace it at next
    /// sign-in and an admin never knows their standing password.
    /// </summary>
    public class SetPhysicianPasswordDto
    {
        [Required]
        [MinLength(8, ErrorMessage = "Use at least 8 characters.")]
        [MaxLength(100)]
        public string Password { get; set; } = string.Empty;
    }
}

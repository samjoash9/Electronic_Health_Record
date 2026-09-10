using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Employee
{
    /// <summary>
    /// An employee directory record entered on the Onboarding page. Employees
    /// have no sign-in of their own — a patient account is provisioned when
    /// Station 1 registers them — so there are no credential fields here.
    /// Mirrors the column widths in the DbContext's Employee configuration.
    /// </summary>
    public class UpsertEmployeeDto
    {
        [Required]
        [MaxLength(50)]
        public string ExternalEmployeeId { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string Surname { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? MiddleName { get; set; }

        [Required]
        public DateTime Birthdate { get; set; }

        [Required]
        [MaxLength(10)]
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
        public string? ContactNo { get; set; }
    }
}

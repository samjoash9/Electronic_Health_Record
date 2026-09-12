using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class Station1SubmitDto
    {
        [Required]
        public Station1PatientDto Patient { get; set; } = new();

        [Required]
        public Station1VitalsDto Vitals { get; set; } = new();
    }

    // Identity fields as captured at Station 1. Mirrors identitySchema on the
    // client (src/lib/schemas.js) plus ExternalEmployeeId, which the employee
    // picker supplies but the identity form itself does not render.
    public class Station1PatientDto
    {
        // Widths match Employee (and the Patient columns these are copied into),
        // not the narrower directory-sized originals -- the HR feed returns free
        // text that overflowed those, which failed ModelState here as a bare 400.
        [Required, MaxLength(50)]
        public string ExternalEmployeeId { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string Surname { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string FirstName { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? MiddleName { get; set; }

        [Required, DataType(DataType.Date)]
        public DateTime Birthdate { get; set; }

        // Free text in the HR feed rather than the ['Male', 'Female'] of
        // SEX_OPTIONS in src/lib/constants.js, so sized like Employee.Sex.
        [Required, MaxLength(150)]
        public string Sex { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string CivilStatus { get; set; } = string.Empty;

        [MaxLength(400)]
        public string? Address { get; set; }

        [MaxLength(200)]
        public string? AgencyOffice { get; set; }

        [MaxLength(400)]
        public string? Position { get; set; }

        [MaxLength(150)]
        public string? ContactNo { get; set; }

        // Only required when this employee has no PatientAccount yet -- the
        // admin asks the patient what they want their login handle to be.
        // Required-ness is enforced in the controller (existing-account
        // submissions never populate this), not here via [Required].
        [MaxLength(30)]
        public string? Username { get; set; }
    }

    // Matches the range checks in vitalsSchema (src/lib/schemas.js).
    public class Station1VitalsDto
    {
        [Required, Range(1, 400)]
        public decimal WeightKg { get; set; }

        [Required, Range(30, 250)]
        public decimal HeightCm { get; set; }

        [Required, Range(0, 999.99)]
        public decimal BMI { get; set; }

        [Required, Range(0, 999.99)]
        public decimal IdealBMI { get; set; }

        [Required, Range(50, 300)]
        public short BPSystolic { get; set; }

        [Required, Range(30, 200)]
        public short BPDiastolic { get; set; }

        [Required, Range(30, 45)]
        public decimal TempCelsius { get; set; }

        [Required, Range(20, 250)]
        public short HeartRate { get; set; }

        [Required, Range(5, 60)]
        public short RespRate { get; set; }
    }
}

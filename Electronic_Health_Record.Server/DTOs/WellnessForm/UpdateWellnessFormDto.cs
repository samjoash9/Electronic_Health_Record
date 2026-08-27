using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class UpdateWellnessFormDto
    {
        // "Draft" (Save as Draft) or "Submitted" (Submit)
        [Required]
        [RegularExpression("^(Draft|Submitted)$", ErrorMessage = "Status must be 'Draft' or 'Submitted'")]
        public string Status { get; set; } = "Draft";

        [Required]
        public int PatientID { get; set; }

        // null while the form is still a draft; required only when submitting
        public int? PhysicianID { get; set; }

        [DataType(DataType.Date)]
        public DateTime? FormDate { get; set; }

        // vital signs
        [Range(0, 999.99)]
        public decimal? WeightKg { get; set; }

        [Range(0, 999.99)]
        public decimal? HeightCm { get; set; }

        [Range(0, 999.99)]
        public decimal? BMI { get; set; }

        [Range(0, 999.99)]
        public decimal? IdealBMI { get; set; }

        [Range(0, 999)]
        public short? BPSystolic { get; set; }

        [Range(0, 999)]
        public short? BPDiastolic { get; set; }

        [Range(0, 99.9)]
        public decimal? TempCelsius { get; set; }

        [Range(0, 999)]
        public short? HeartRate { get; set; }

        [Range(0, 999)]
        public short? RespRate { get; set; }

        [MaxLength(150)]
        public string? RecommendedDiagnosticTest { get; set; }

        [MaxLength(300)]
        public string? ImpressionClinical { get; set; }

        [MaxLength(300)]
        public string? ManagementTreatment { get; set; }

        public int? UpdatedByAdminID { get; set; }

        // full replacement lists — checked/unchecked condition rows (e.g. Stroke, Diabetes Mellitus)
        // are sent as the complete current set, and the server swaps out the old rows for these.
        public List<PastMedicalHistoryItemDto> PastMedicalHistory { get; set; } = new();

        public List<FamilyMedicalHistoryItemDto> FamilyMedicalHistory { get; set; } = new();

        public SocialHistoryDto? SocialHistory { get; set; }
    }
}

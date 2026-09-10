using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class CreateWellnessFormDto
    {
        // "Draft" (Save as Draft) or "PendingSignature" (Submit for signature).
        // "Submitted" is the old wire value and is still accepted, then normalised.
        // "Signed" is deliberately absent: only the sign endpoint may produce it.
        [Required]
        [RegularExpression("^(Draft|PendingSignature|Submitted)$", ErrorMessage = "Status must be 'Draft' or 'PendingSignature'")]
        public string Status { get; set; } = "Draft";

        [Required]
        public int PatientID { get; set; }

        // null while the form is still a draft; required only when submitting
        public int? PhysicianID { get; set; }

        // signature pad output as a base64 data URL; required only when submitting.
        // no MaxLength: the column is nvarchar(max)
        public string? Signature { get; set; }

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

        [MaxLength(200)]
        public string? RecommendedDiagnosticTest { get; set; }

        [MaxLength(300)]
        public string? ImpressionClinical { get; set; }

        [MaxLength(300)]
        public string? ManagementTreatment { get; set; }

        public int? CreatedByAdminID { get; set; }

        public List<PastMedicalHistoryItemDto> PastMedicalHistory { get; set; } = new();

        public List<FamilyMedicalHistoryItemDto> FamilyMedicalHistory { get; set; } = new();

        public List<ExerciseItemDto> Exercise { get; set; } = new();

        public SocialHistoryDto? SocialHistory { get; set; }
    }

    public class PastMedicalHistoryItemDto
    {
        // either a known condition from MedicalCondition, or free text in ConditionOther
        public int? ConditionID { get; set; }

        [MaxLength(100)]
        public string? ConditionOther { get; set; }

        [Range(1900, 2200)]
        public short? YearDiagnosed { get; set; }

        [MaxLength(100)]
        public string? MaintenanceDrugGeneric { get; set; }

        [MaxLength(20)]
        public string? Dosage { get; set; }

        [MaxLength(50)]
        public string? Frequency { get; set; }
    }

    public class FamilyMedicalHistoryItemDto
    {
        public int? ConditionID { get; set; }

        // free text for "Others (Specify)"
        [MaxLength(100)]
        public string? ConditionOther { get; set; }

        // true for the single "None (No known history)" row
        public bool? IsNone { get; set; }

        // subtype of the condition (e.g. "Type 2", "Breast") — only sent for
        // Diabetes Mellitus, Cancer, and Others rows
        [MaxLength(300)]
        public string? ConditionType { get; set; }
    }

    public class ExerciseItemDto
    {
        [Required]
        [MaxLength(100)]
        public string ExerciseType { get; set; } = null!;

        [MaxLength(50)]
        public string? ExerciseFrequency { get; set; }

        [MaxLength(4)]
        public string? ExerciseYearStarted { get; set; }
    }

    public class SocialHistoryDto
    {
        // null means unanswered; the Yes/No pair starts with neither selected
        public bool? Smokes { get; set; }

        public bool SmokesCigarette { get; set; }

        [MaxLength(20)]
        public string? CigaretteSticksPerDay { get; set; }

        [MaxLength(50)]
        public string? CigaretteFrequency { get; set; }

        [MaxLength(4)]
        public string? CigaretteYearStarted { get; set; }

        [MaxLength(20)]
        public string? CigarettePuffsPerDay { get; set; }

        public bool SmokesEcig { get; set; }

        [MaxLength(20)]
        public string? EcigPodsPerMonth { get; set; }

        [MaxLength(50)]
        public string? EcigFrequency { get; set; }

        [MaxLength(4)]
        public string? EcigYearStarted { get; set; }

        [MaxLength(20)]
        public string? EcigPuffsPerDay { get; set; }

        [MaxLength(50)]
        public string? AlcoholType { get; set; }

        [MaxLength(50)]
        public string? DrinkFrequency { get; set; }

        [MaxLength(20)]
        public string? DrinksPerSession { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class CreateWellnessFormDto
    {
        // "Draft" (Save as Draft) or "Submitted" (Submit)
        [Required]
        [RegularExpression("^(Draft|Submitted)$", ErrorMessage = "Status must be 'Draft' or 'Submitted'")]
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

        [MaxLength(150)]
        public string? RecommendedDiagnosticTest { get; set; }

        [MaxLength(300)]
        public string? ImpressionClinical { get; set; }

        [MaxLength(300)]
        public string? ManagementTreatment { get; set; }

        public int? CreatedByAdminID { get; set; }

        public List<PastMedicalHistoryItemDto> PastMedicalHistory { get; set; } = new();

        public List<FamilyMedicalHistoryItemDto> FamilyMedicalHistory { get; set; } = new();

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

        // free text for "Others (Specify)" and the cancer type box
        [MaxLength(100)]
        public string? ConditionOther { get; set; }

        // true for the single "None (No known history)" row
        public bool? IsNone { get; set; }
    }

    public class SocialHistoryDto
    {
        [Range(0, 999)]
        public short? SmokingSticksPerDay { get; set; }

        [MaxLength(50)]
        public string? AlcoholType { get; set; }

        [MaxLength(50)]
        public string? DrinkFrequency { get; set; }

        [MaxLength(20)]
        public string? DrinksPerSession { get; set; }

        public bool? HasBeenDrunk { get; set; }

        [MaxLength(50)]
        public string? DrunkFrequency { get; set; }

        [MaxLength(50)]
        public string? ExerciseFrequency { get; set; }

        [MaxLength(100)]
        public string? ExerciseType { get; set; }
    }
}

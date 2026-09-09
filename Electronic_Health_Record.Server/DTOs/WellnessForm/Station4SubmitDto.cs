using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    /// <summary>
    /// Station 4 (Dental) submit payload. The client nests the ten indicators
    /// under "dentalAssessment" and spreads dentistID/dentalSignature/rowVersion
    /// flat alongside it -- see submitStation4 in src/api/forms.api.js.
    /// </summary>
    public class Station4SubmitDto
    {
        [Required(ErrorMessage = "An examining dentist is required before submitting.")]
        public int? DentistID { get; set; }

        public DentalAssessmentDto? DentalAssessment { get; set; }

        [Required(ErrorMessage = "A dentist signature is required before submitting.")]
        public string DentalSignature { get; set; } = string.Empty;

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }

    /// <summary>
    /// The ten dental indicators and their per-item remarks. Allowed values for
    /// each indicator are enforced by CK_DentalAssessment_* constraints in the
    /// DbContext; they are not repeated as [RegularExpression] here because the
    /// list lives in exactly two places already (the DbContext and
    /// DENTAL_INDICATORS in src/lib/constants.js) and a third copy would drift.
    /// </summary>
    public class DentalAssessmentDto
    {
        [MaxLength(50)] public string? OralHygieneStatus { get; set; }
        [MaxLength(300)] public string? OralHygieneStatusRemarks { get; set; }

        [MaxLength(50)] public string? DentalCaries { get; set; }
        [MaxLength(300)] public string? DentalCariesRemarks { get; set; }

        [MaxLength(50)] public string? GumCondition { get; set; }
        [MaxLength(300)] public string? GumConditionRemarks { get; set; }

        [MaxLength(50)] public string? ToothStatus { get; set; }
        [MaxLength(300)] public string? ToothStatusRemarks { get; set; }

        [MaxLength(50)] public string? ToothachePain { get; set; }
        [MaxLength(300)] public string? ToothachePainRemarks { get; set; }

        [MaxLength(50)] public string? OralLesions { get; set; }
        [MaxLength(300)] public string? OralLesionsRemarks { get; set; }

        [MaxLength(50)] public string? DentureUse { get; set; }
        [MaxLength(300)] public string? DentureUseRemarks { get; set; }

        [MaxLength(50)] public string? DentalTreatmentNeed { get; set; }
        [MaxLength(300)] public string? DentalTreatmentNeedRemarks { get; set; }

        [MaxLength(50)] public string? LastDentalVisit { get; set; }
        [MaxLength(300)] public string? LastDentalVisitRemarks { get; set; }

        [MaxLength(50)] public string? DentalReferral { get; set; }
        [MaxLength(300)] public string? DentalReferralRemarks { get; set; }
    }
}

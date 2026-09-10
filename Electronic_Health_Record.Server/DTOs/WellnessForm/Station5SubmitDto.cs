using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    /// <summary>
    /// Station 5 (Vision) submit payload. The client nests the thirteen
    /// indicators under "visionAssessment" and spreads
    /// optometristID/visionSignature/rowVersion flat alongside it -- see
    /// submitStation5 in src/api/forms.api.js.
    /// </summary>
    public class Station5SubmitDto
    {
        [Required(ErrorMessage = "An examining optometrist is required before submitting.")]
        public int? OptometristID { get; set; }

        public VisionAssessmentDto? VisionAssessment { get; set; }

        [Required(ErrorMessage = "An optometrist signature is required before submitting.")]
        public string VisionSignature { get; set; } = string.Empty;

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }

    /// <summary>
    /// The thirteen vision indicators and their per-item remarks. Allowed
    /// values for the choice indicators are enforced by CK_VisionAssessment_*
    /// constraints in the DbContext; they are not repeated as
    /// [RegularExpression] here because the list lives in exactly two places
    /// already (the DbContext and VISION_INDICATORS in src/lib/constants.js)
    /// and a third copy would drift.
    /// </summary>
    public class VisionAssessmentDto
    {
        [MaxLength(50)] public string? HistoryOfEyeProblems { get; set; }
        [MaxLength(300)] public string? HistoryOfEyeProblemsRemarks { get; set; }

        [MaxLength(50)] public string? EyePainDiscomfort { get; set; }
        [MaxLength(300)] public string? EyePainDiscomfortRemarks { get; set; }

        [MaxLength(50)] public string? BlurredVision { get; set; }
        [MaxLength(300)] public string? BlurredVisionRemarks { get; set; }

        [MaxLength(50)] public string? DifficultySeeingNear { get; set; }
        [MaxLength(300)] public string? DifficultySeeingNearRemarks { get; set; }

        [MaxLength(50)] public string? DifficultySeeingDistant { get; set; }
        [MaxLength(300)] public string? DifficultySeeingDistantRemarks { get; set; }

        [MaxLength(50)] public string? HeadacheEyeStrain { get; set; }
        [MaxLength(300)] public string? HeadacheEyeStrainRemarks { get; set; }

        [MaxLength(50)] public string? UsesEyeglassesContactLenses { get; set; }
        [MaxLength(300)] public string? UsesEyeglassesContactLensesRemarks { get; set; }

        [MaxLength(50)] public string? VisualAcuityRightEye { get; set; }
        [MaxLength(300)] public string? VisualAcuityRightEyeRemarks { get; set; }

        [MaxLength(50)] public string? VisualAcuityLeftEye { get; set; }
        [MaxLength(300)] public string? VisualAcuityLeftEyeRemarks { get; set; }

        [MaxLength(50)] public string? EyeConditionIdentified { get; set; }
        [MaxLength(100)] public string? EyeConditionOther { get; set; }
        [MaxLength(300)] public string? EyeConditionIdentifiedRemarks { get; set; }

        [MaxLength(50)] public string? CorrectiveLensesRecommended { get; set; }
        [MaxLength(300)] public string? CorrectiveLensesRecommendedRemarks { get; set; }

        [MaxLength(50)] public string? ReferralToEyeSpecialist { get; set; }
        [MaxLength(300)] public string? ReferralToEyeSpecialistRemarks { get; set; }

        [MaxLength(50)] public string? FollowUpConsultationAdvised { get; set; }
        [MaxLength(300)] public string? FollowUpConsultationAdvisedRemarks { get; set; }
    }
}

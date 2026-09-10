namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// Station 5's vision screening: thirteen indicators, each with its own
    /// free-text remarks field for the examiner. One row per form. Same shape
    /// as DentalAssessment -- ten Yes/No-style single-selects, plus two free-text
    /// acuity readings (items 8-9) and one single-select-with-specify (item 10).
    /// </summary>
    public class VisionAssessment
    {
        public int VisionAssessmentID { get; set; }
        public int FormID { get; set; }

        // Every indicator is nullable: null means the examiner left it
        // unanswered, distinct from any listed value. Same convention as
        // DentalAssessment. Allowed values for the choice indicators are
        // enforced by per-column CHECK constraints in the DbContext and must
        // match VISION_INDICATORS in src/lib/constants.js exactly -- the client
        // hardcodes that array rather than reading it from the API, so any
        // drift silently desyncs the form.
        public string? HistoryOfEyeProblems { get; set; }
        public string? HistoryOfEyeProblemsRemarks { get; set; }

        public string? EyePainDiscomfort { get; set; }
        public string? EyePainDiscomfortRemarks { get; set; }

        public string? BlurredVision { get; set; }
        public string? BlurredVisionRemarks { get; set; }

        public string? DifficultySeeingNear { get; set; }
        public string? DifficultySeeingNearRemarks { get; set; }

        public string? DifficultySeeingDistant { get; set; }
        public string? DifficultySeeingDistantRemarks { get; set; }

        public string? HeadacheEyeStrain { get; set; }
        public string? HeadacheEyeStrainRemarks { get; set; }

        public string? UsesEyeglassesContactLenses { get; set; }
        public string? UsesEyeglassesContactLensesRemarks { get; set; }

        // Free-text acuity readings (e.g. "20/20"), not a constrained choice.
        public string? VisualAcuityRightEye { get; set; }
        public string? VisualAcuityRightEyeRemarks { get; set; }

        public string? VisualAcuityLeftEye { get; set; }
        public string? VisualAcuityLeftEyeRemarks { get; set; }

        // Single-select with a specify field: EyeConditionOther holds the
        // free-text condition name when EyeConditionIdentified is "Other",
        // same pattern as FamilyMedicalHistory.ConditionOther.
        public string? EyeConditionIdentified { get; set; }
        public string? EyeConditionOther { get; set; }
        public string? EyeConditionIdentifiedRemarks { get; set; }

        public string? CorrectiveLensesRecommended { get; set; }
        public string? CorrectiveLensesRecommendedRemarks { get; set; }

        public string? ReferralToEyeSpecialist { get; set; }
        public string? ReferralToEyeSpecialistRemarks { get; set; }

        public string? FollowUpConsultationAdvised { get; set; }
        public string? FollowUpConsultationAdvisedRemarks { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

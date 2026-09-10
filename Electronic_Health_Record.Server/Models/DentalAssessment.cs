namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// Station 4's dental screening: ten single-select indicators, each with its
    /// own free-text remarks field for the doctor. One row per form.
    /// </summary>
    public class DentalAssessment
    {
        public int DentalAssessmentID { get; set; }
        public int FormID { get; set; }

        // Every indicator is nullable: null means the dentist left it unanswered,
        // which is distinct from any of the listed values. Same convention as
        // SocialHistory.Smokes. Allowed values are enforced by per-column CHECK
        // constraints in the DbContext and must match DENTAL_INDICATORS in
        // src/lib/constants.js exactly -- the client hardcodes that array rather
        // than reading it from the API, so any drift silently desyncs the form.
        public string? OralHygieneStatus { get; set; }
        public string? OralHygieneStatusRemarks { get; set; }

        public string? DentalCaries { get; set; }
        public string? DentalCariesRemarks { get; set; }

        public string? GumCondition { get; set; }
        public string? GumConditionRemarks { get; set; }

        public string? ToothStatus { get; set; }
        public string? ToothStatusRemarks { get; set; }

        public string? ToothachePain { get; set; }
        public string? ToothachePainRemarks { get; set; }

        public string? OralLesions { get; set; }
        public string? OralLesionsRemarks { get; set; }

        public string? DentureUse { get; set; }
        public string? DentureUseRemarks { get; set; }

        public string? DentalTreatmentNeed { get; set; }
        public string? DentalTreatmentNeedRemarks { get; set; }

        public string? LastDentalVisit { get; set; }
        public string? LastDentalVisitRemarks { get; set; }

        public string? DentalReferral { get; set; }
        public string? DentalReferralRemarks { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    /// <summary>
    /// The superadmin correction payload for PATCH /api/wellnessforms/{formID}.
    ///
    /// Every property is nullable and every one is optional: this is a sparse
    /// patch, not a replacement. A field the client leaves out is left alone,
    /// which is what lets the UI send one corrected blood pressure without
    /// blanking the forty other fields it did not render. That also means a
    /// property here can carry two different intents -- absent ("don't touch")
    /// and explicitly null ("clear this") -- so the controller reads the raw
    /// JSON key set rather than only the deserialised object.
    ///
    /// Deliberately absent: Status, CurrentStation, Signature, SignedAt,
    /// DentalSignature/DentalSignedAt, VisionSignature/VisionSignedAt. Workflow
    /// state belongs to the stations, and a signature is a practitioner's
    /// attestation -- a superadmin fixing a typo must never be able to forge or
    /// silently re-date one.
    /// </summary>
    public class SuperAdminEditFormDto
    {
        /// <summary>
        /// Optimistic concurrency token from the form the operator was looking
        /// at. Required: an edit computed against a stale copy of the record is
        /// exactly the clobber this guards against.
        /// </summary>
        [Required]
        public string RowVersion { get; set; } = string.Empty;

        /// <summary>
        /// Free-text justification, written into the audit log beside the
        /// field-level diff. Optional on an unsigned form; the client asks for
        /// one when the record has already been signed.
        /// </summary>
        [MaxLength(500)]
        public string? Reason { get; set; }

        // ---- attribution ------------------------------------------------
        // The three practitioners can be corrected (wrong doctor picked at the
        // station), but only to another active practitioner -- validated in the
        // controller, same rule the station submits enforce.

        public int? PhysicianID { get; set; }
        public int? DentistID { get; set; }
        public int? OptometristID { get; set; }

        [DataType(DataType.Date)]
        public DateTime? FormDate { get; set; }

        // ---- Station 1: vitals ------------------------------------------

        [Range(0, 999.99)] public decimal? WeightKg { get; set; }
        [Range(0, 999.99)] public decimal? HeightCm { get; set; }
        [Range(0, 999.99)] public decimal? BMI { get; set; }
        [Range(0, 999.99)] public decimal? IdealBMI { get; set; }
        [Range(0, 999)] public short? BPSystolic { get; set; }
        [Range(0, 999)] public short? BPDiastolic { get; set; }
        [Range(0, 99.9)] public decimal? TempCelsius { get; set; }
        [Range(0, 999)] public short? HeartRate { get; set; }
        [Range(0, 999)] public short? RespRate { get; set; }

        // ---- Station 3: the physician's assessment ----------------------

        [MaxLength(200)] public string? RecommendedDiagnosticTest { get; set; }
        [MaxLength(300)] public string? ImpressionClinical { get; set; }
        [MaxLength(300)] public string? ManagementTreatment { get; set; }

        // ---- child collections ------------------------------------------
        // Each of these is replaced wholesale when its key is present, matching
        // how the station submits treat them: the client holds the complete
        // current set and sends it back, so a removed row is expressed by its
        // absence from the list rather than by a delete call.

        public List<PastMedicalHistoryItemDto>? PastMedicalHistory { get; set; }
        public List<FamilyMedicalHistoryItemDto>? FamilyMedicalHistory { get; set; }
        public List<ExerciseItemDto>? Exercise { get; set; }
        public SocialHistoryDto? SocialHistory { get; set; }
        public List<Station2AnswerDto>? AssessmentAnswers { get; set; }

        /// <summary>Station 4's ten indicators. Reuses the station's own DTO.</summary>
        public DentalAssessmentDto? DentalAssessment { get; set; }

        /// <summary>Station 5's thirteen indicators. Reuses the station's own DTO.</summary>
        public VisionAssessmentDto? VisionAssessment { get; set; }

        /// <summary>
        /// Billing lines for this visit. Repriced from the catalog by the
        /// controller, same as Station 3 -- a client-supplied price is never
        /// trusted.
        /// </summary>
        public List<ChargeItemSubmitDto>? Charges { get; set; }
    }
}

namespace Electronic_Health_Record.Server.Models
{
    public class WellnessForm
    {
        public int FormID { get; set; }
        public int PatientID { get; set; }
        // the physician the Admin routed this form to. a routing decision: mutable, and null
        // while the form is still a draft. required once the status leaves Draft.
        public int? AssignedPhysicianID { get; set; }
        // the physician who actually signed. a clinical attestation: written once by the sign
        // endpoint, never rewritten -- which is what stops a later reassignment from silently
        // forging the signer.
        public int? SignedByPhysicianID { get; set; }
        // "Draft", "PendingSignature" or "Signed" -- see FormStatus
        public string Status { get; set; } = FormStatus.Draft;
        // the signing physician's signature, stored as the signature pad's base64 data URL
        public string? Signature { get; set; }
        // when the signature was captured
        public DateTime? SignedAt { get; set; }
        public DateTime FormDate { get; set; }
        public decimal? WeightKg { get; set; }
        public decimal? HeightCm { get; set; }
        public decimal? BMI { get; set; }
        public decimal? IdealBMI { get; set; }
        public short? BPSystolic { get; set; }
        public short? BPDiastolic { get; set; }
        public decimal? TempCelsius { get; set; }
        public short? HeartRate { get; set; }
        public short? RespRate { get; set; }
        public string? RecommendedDiagnosticTest { get; set; }
        public string? ImpressionClinical { get; set; }
        public string? ManagementTreatment { get; set; }
        // authorship is always staff: physicians sign forms, they never author them
        public int? CreatedByAdminID { get; set; }
        public int? UpdatedByAdminID { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

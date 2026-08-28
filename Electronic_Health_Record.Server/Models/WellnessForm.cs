namespace Electronic_Health_Record.Server.Models
{
    public class WellnessForm
    {
        public int FormID { get; set; }
        public int PatientID { get; set; }
        // null while the form is still a draft and no physician has been assigned yet
        public int? PhysicianID { get; set; }
        // "Draft" or "Submitted"
        public string Status { get; set; } = "Draft";
        // physician's digital signature, stored as the signature pad's base64 data URL;
        // a form cannot reach "Submitted" without one
        public string? Signature { get; set; }
        // when the signature was captured; only re-stamped when the signature itself changes
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
        public int? CreatedByAdminID { get; set; }
        public int? UpdatedByAdminID { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

namespace Electronic_Health_Record.Server.Models
{
    public class WellnessForm
    {
        public int FormID { get; set; }
        public int PatientID { get; set; }
        // null until a doctor picks the form up at Station 3
        public int? PhysicianID { get; set; }
        // workflow state; drives which station queue the form appears in.
        // "PendingAssessment"   Station 1 done, waiting for Station 2
        // "PendingConsultation" Station 2 done, waiting for Station 3
        // "PendingDental"       Station 3 done and signed, waiting for Station 4.
        //                       Note this is a signed-but-not-completed state:
        //                       before Station 4 existed, SignedAt and
        //                       "Completed" were always set together.
        // "PendingVision"       Station 4 done and signed, waiting for Station 5.
        //                       Before Station 5 existed, DentalSignedAt and
        //                       "Completed" were always set together.
        // "Completed"           Station 5 done and signed by the optometrist
        // "Cancelled"
        public string Status { get; set; } = "PendingAssessment";
        public byte CurrentStation { get; set; } = 1;
        // optimistic concurrency: three stations on three devices touch this row,
        // so a stale submit must not silently clobber a later station's work
        public byte[]? RowVersion { get; set; }
        // physician's digital signature, stored as the signature pad's base64 data URL;
        // a form cannot reach "Completed" without one
        public string? Signature { get; set; }
        // when the signature was captured
        public DateTime? SignedAt { get; set; }
        // Who signed, captured as text at signing time. PhysicianID can be
        // nulled out when a superadmin deletes the account, so the FK alone
        // cannot answer "who signed this record" for the lifetime of the form.
        // These are written alongside the signature and never updated after.
        public string? SignedByName { get; set; }
        public string? SignedByLicenseNo { get; set; }
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
        public int? Station1AdminID { get; set; }
        // Who took the vitals, kept as text so the attribution survives deletion
        // of that admin's account -- same reason as SignedByName below. Written
        // at submit time; the delete backfills it for older rows.
        public string? Station1AdminName { get; set; }
        public DateTime? Station1SubmittedAt { get; set; }

        // Station 2 answers are rows in AssessmentAnswer; only the station's
        // attribution and hand-off timestamp live here
        public int? Station2AdminID { get; set; }
        // see Station1AdminName: survives deletion of the admin's account
        public string? Station2AdminName { get; set; }
        // When the kiosk was first opened for this form, i.e. the tablet was
        // handed to the patient. Lets every Station 2 desk tell "answering" from
        // "not yet answered" -- the in-progress answers themselves live only in
        // that tablet's localStorage. Cleared by a revert back to Station 2.
        // Station3/4/5StartedAt below are the same marker for those desks.
        public DateTime? Station2StartedAt { get; set; }
        public DateTime? Station2SubmittedAt { get; set; }
        public string? RecommendedDiagnosticTest { get; set; }
        public string? ImpressionClinical { get; set; }
        public string? ManagementTreatment { get; set; }
        // first open of the consultation page; see Station2StartedAt
        public DateTime? Station3StartedAt { get; set; }
        public DateTime? Station3SubmittedAt { get; set; }

        // Station 4 (Dental). The dentist is a Physician row -- the schema has no
        // separate practitioner table -- but is tracked apart from PhysicianID so
        // the consulting doctor and the examining dentist can differ.
        public int? DentistID { get; set; }
        public string? DentalSignature { get; set; }
        public DateTime? DentalSignedAt { get; set; }
        // see SignedByName: survives deletion of the dentist's account
        public string? DentalSignedByName { get; set; }
        public string? DentalSignedByLicenseNo { get; set; }
        // first open of the dental page; see Station2StartedAt
        public DateTime? Station4StartedAt { get; set; }
        public DateTime? Station4SubmittedAt { get; set; }

        // Station 5 (Vision). Same pattern as DentistID: the optometrist is a
        // Physician row, tracked apart from PhysicianID/DentistID so all three
        // can differ.
        public int? OptometristID { get; set; }
        public string? VisionSignature { get; set; }
        public DateTime? VisionSignedAt { get; set; }
        // see SignedByName: survives deletion of the optometrist's account
        public string? VisionSignedByName { get; set; }
        public string? VisionSignedByLicenseNo { get; set; }
        // first open of the vision page; see Station2StartedAt
        public DateTime? Station5StartedAt { get; set; }
        public DateTime? Station5SubmittedAt { get; set; }
        public int? CreatedByAdminID { get; set; }
        public int? UpdatedByAdminID { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

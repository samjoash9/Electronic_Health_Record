namespace Electronic_Health_Record.Server.Models
{
    public class WellnessFormAuditLog
    {
        public long LogID { get; set; }
        public int FormID { get; set; }
        // "Admin" | "Physician" | "Patient" | "System"
        public string ActorType { get; set; } = string.Empty;
        // AdminID / PhysicianID / PatientAccountID; null when ActorType is "System".
        // Deliberately not an FK: the three actor kinds live in three tables and
        // audit rows must survive removal of the actor row.
        public int? ActorID { get; set; }
        // "Station1Submitted" | "Station2Submitted" | "Station3Signed" | ...
        public string Action { get; set; } = string.Empty;
        public string? Details { get; set; }
        public DateTime OccurredAt { get; set; }
    }
}

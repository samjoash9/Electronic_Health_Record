namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// One audit entry: who did what, to which form (if any), and whether it succeeded.
    /// ActorID is polymorphic -- it's an AdminID or a PhysicianID depending on ActorRole, so it
    /// carries no FK; ActorRole is stored alongside (not looked up) because the actor's role at
    /// the time of the action must survive a later role change or account deletion.
    /// </summary>
    public class ActivityLog
    {
        public int LogID { get; set; }
        public string Action { get; set; } = string.Empty;
        public int? FormID { get; set; }
        public int ActorID { get; set; }
        // "SuperAdmin", "Admin" or "Physician" -- see Roles
        public string ActorRole { get; set; } = string.Empty;
        // "SUCCESS", "FAILED" or "WARNING" -- see ActivityStatus
        public string Status { get; set; } = ActivityStatus.Success;
        // for the notification bell: false until a viewer opens/dismisses it
        public bool IsViewed { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

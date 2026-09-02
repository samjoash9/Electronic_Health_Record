namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// The outcome of a logged action. Enforced in the database by CK_ActivityLog_Status.
    /// </summary>
    public static class ActivityStatus
    {
        public const string Success = "SUCCESS";
        public const string Failed = "FAILED";
        public const string Warning = "WARNING";
    }
}

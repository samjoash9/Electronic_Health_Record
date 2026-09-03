namespace Electronic_Health_Record.Server.Models
{
    public class PatientSession
    {
        public int SessionID { get; set; }
        public int PatientAccountID { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

namespace Electronic_Health_Record.Server.Models
{
    public class PhysicianSession
    {
        public int SessionID { get; set; }
        public int PhysicianID { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

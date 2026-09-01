namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// One logged-in session, for either kind of principal. Exactly one of AdminID / PhysicianID
    /// is set -- CK_UserSession_ExactlyOnePrincipal enforces it. Keeping both kinds in one table
    /// means one lookup per authenticated request instead of a union across two tables.
    ///
    /// TokenHash holds SHA-256(token) as lowercase hex, so a database dump is not a session dump;
    /// the raw token is returned to the client once at login and never stored.
    /// </summary>
    public class UserSession
    {
        public int SessionID { get; set; }
        public int? AdminID { get; set; }
        public int? PhysicianID { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

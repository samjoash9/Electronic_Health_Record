namespace Electronic_Health_Record.Server.DTOs.Auth;

    public class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow;
        public int AdminID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;




}
namespace Electronic_Health_Record.Server.DTOs.Auth
{
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password {  get; set; } = string.Empty;
    }
}

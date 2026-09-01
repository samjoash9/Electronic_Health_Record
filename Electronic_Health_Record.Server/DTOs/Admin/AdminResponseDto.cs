namespace Electronic_Health_Record.Server.DTOs.Admin
{
    /// <summary>
    /// The safe public shape of a staff account. Deliberately omits PasswordHash --
    /// the entity must never be serialised directly.
    /// </summary>
    public class AdminResponseDto
    {
        public int AdminID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public bool MustChangePassword { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public static AdminResponseDto From(Models.Admin a) => new()
        {
            AdminID = a.AdminID,
            Username = a.Username,
            Email = a.Email,
            FullName = a.FullName,
            Role = a.Role,
            IsActive = a.IsActive,
            MustChangePassword = a.MustChangePassword,
            LastLoginAt = a.LastLoginAt,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt
        };
    }
}

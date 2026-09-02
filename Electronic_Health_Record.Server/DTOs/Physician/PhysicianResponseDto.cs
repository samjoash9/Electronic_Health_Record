namespace Electronic_Health_Record.Server.DTOs.Physician
{
    /// <summary>
    /// The safe public shape of a physician. Deliberately omits PasswordHash: the entity
    /// carries login credentials, so it must never be serialised directly.
    /// </summary>
    public class PhysicianResponseDto
    {
        public int PhysicianID { get; set; }
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = string.Empty;
        public string PRCLicenseNo { get; set; } = string.Empty;

        // account status, safe to expose -- never the hash itself
        public bool IsActive { get; set; }

        /// <summary>
        /// True when this physician has portal credentials and is active, i.e. could actually
        /// sign a form. A directory-only entry can be assigned one but can never sign it, so the
        /// assignment picker should filter on this.
        /// </summary>
        public bool CanSign { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public static PhysicianResponseDto From(Models.Physician p) => new()
        {
            PhysicianID = p.PhysicianID,
            Surname = p.Surname,
            FirstName = p.FirstName,
            MiddleName = p.MiddleName,
            PRCLicenseNo = p.PRCLicenseNo,
            IsActive = p.IsActive,
            CanSign = p.Email != null && p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}

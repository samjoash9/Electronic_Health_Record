namespace Electronic_Health_Record.Server.DTOs.Physician
{
    /// <summary>
    /// The safe public shape of a physician. Deliberately omits PasswordHash: the entity
    /// carries login credentials, so it must never be serialised directly.
    /// </summary>
    public class PhysicianResponseDto
    {
        public int PhysicianID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; } = string.Empty;
        public string PRCLicenseNo { get; set; } = string.Empty;
        public string? ContactNo { get; set; }
        // Which desk this doctor staffs: 3 Consultation, 4 Dental, 5 Vision.
        public int Station { get; set; }
        // Still on the password an admin issued: surfaced so Onboarding can show
        // which accounts have never been claimed.
        public bool MustChangePassword { get; set; }
        public bool IsActive { get; set; }
        // A directory-only row (no login granted yet) has an empty Username and can be
        // assigned a form but never actually sign it -- see Models.Physician's doc comment.
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
            Station = p.Station,
            Username = p.Username,
            IsActive = p.IsActive,
            CanSign = !string.IsNullOrEmpty(p.Username) && p.IsActive,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}

namespace Electronic_Health_Record.Server.DTOs.User
{

    public class CreateAdminRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
    }

    public class CreateAdminResponse
    {
        public int AdminID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        // Shown exactly once. The caller is responsible for relaying this
        // to the new admin out-of-band; it is never stored or returned again.
        public string TemporaryPassword { get; set; } = string.Empty;
    }


    // -------------------------------------------------------------
    // Create Physician (SuperAdmin or Admin)
    // -------------------------------------------------------------

    public class CreatePhysicianRequest
    {
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string PRCLicenseNo { get; set; } = string.Empty;

        // If false, this creates a directory-only physician (assignable to
        // forms but cannot log in or sign). If true, Username must be set
        // and portal credentials are provisioned.
        public bool GrantPortalAccess { get; set; }
        public string? Username { get; set; }
    }

    public class CreatePhysicianResponse
    {
        public int PhysicianID { get; set; }
        public string Surname { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string? MiddleName { get; set; }
        public string PRCLicenseNo { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? Email { get; set; }

        // Only populated when GrantPortalAccess was true. Shown exactly once.
        public string? TemporaryPassword { get; set; }
    }
}

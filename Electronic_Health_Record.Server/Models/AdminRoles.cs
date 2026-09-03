namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// Permission tiers inside the Admin table. The DB enforces these exact values
    /// with CK_Admin_Role, so anything added here needs a matching migration.
    /// </summary>
    public static class AdminRoles
    {
        /// <summary>Hospital staff working Stations 1-2.</summary>
        public const string Admin = "admin";

        /// <summary>Full access, including managing other admin accounts.</summary>
        public const string SuperAdmin = "superadmin";

        public static readonly string[] All = [Admin, SuperAdmin];

        public static bool IsValid(string? role) => All.Contains(role);
    }
}

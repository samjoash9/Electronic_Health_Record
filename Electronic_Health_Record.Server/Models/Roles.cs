namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// The three access roles. Use these constants everywhere instead of string literals --
    /// a typo in a role check denies access silently and is miserable to debug.
    /// </summary>
    public static class Roles
    {
        /// <summary>The developers. Reads and administers everything, but cannot sign a form.</summary>
        public const string SuperAdmin = "SuperAdmin";

        /// <summary>Interviews patients, fills wellness forms, and chooses which physician must sign.</summary>
        public const string Admin = "Admin";

        /// <summary>The only role that can sign a wellness form.</summary>
        public const string Physician = "Physician";

        /// <summary>
        /// The values legal in Admin.Role. "Physician" is deliberately absent: physicians live in
        /// their own table, which is what structurally prevents a staff account from ever signing.
        /// </summary>
        public static readonly string[] StaffRoles = [SuperAdmin, Admin];
    }
}

namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// Named authorization policies, registered in Program.cs. Use these
    /// constants in [Authorize(Policy = ...)] rather than string literals.
    /// </summary>
    public static class AuthPolicies
    {
        /// <summary>
        /// Any staff account -- admin, superadmin or physician -- and never a
        /// patient. Physicians carry no Role claim (see TokenService), so
        /// [Authorize(Roles = ...)] cannot express this; the policy reads the
        /// PrincipalType claim instead.
        /// </summary>
        public const string Staff = "Staff";
    }
}

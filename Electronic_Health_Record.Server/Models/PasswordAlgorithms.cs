namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// Names the scheme a stored PasswordHash was produced with, so login can verify an old hash
    /// and transparently rewrite it in the new format instead of forcing a password reset.
    /// </summary>
    public static class PasswordAlgorithms
    {
        /// <summary>Unsalted SHA-256, as produced by DbSeeder. Verify-only; never write new ones.</summary>
        public const string Sha256Legacy = "SHA256-LEGACY";

        /// <summary>PBKDF2-HMACSHA256. The target format, written by the authentication work.</summary>
        public const string Pbkdf2 = "PBKDF2";
    }
}

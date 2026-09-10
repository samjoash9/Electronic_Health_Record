using System.Security.Cryptography;
using System.Text;

namespace Electronic_Health_Record.Server.Services
{
    /// <summary>
    /// Unsalted SHA-256, matching the hashes DbSeeder has always written.
    ///
    /// This is NOT a suitable password hash for production: it is fast by design,
    /// which is the opposite of what a password needs, and being unsalted means
    /// identical passwords produce identical hashes. It stays only so existing
    /// seeded logins keep working. Replacing it with a salted, iterated KDF
    /// (ASP.NET Core's PasswordHasher, or Argon2/bcrypt) means changing this
    /// class and re-hashing every stored credential.
    /// </summary>
    public class Sha256PasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
            var builder = new StringBuilder(bytes.Length * 2);
            foreach (var b in bytes)
            {
                builder.Append(b.ToString("x2"));
            }
            return builder.ToString();
        }
    }
}

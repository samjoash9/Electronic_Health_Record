namespace Electronic_Health_Record.Server.Services
{
    /// <summary>
    /// Turns a plaintext password into the value stored in PasswordHash.
    ///
    /// One implementation, one algorithm: the seeder and the onboarding endpoints
    /// have to agree, or an account created by one cannot sign in against the
    /// other. Replacing the algorithm is a change to the implementation plus a
    /// re-hash of existing rows, not a second hasher.
    /// </summary>
    public interface IPasswordHasher
    {
        string Hash(string password);
    }
}

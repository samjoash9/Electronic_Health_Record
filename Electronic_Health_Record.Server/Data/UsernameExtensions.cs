using Microsoft.EntityFrameworkCore;

namespace Electronic_Health_Record.Server.Data
{
    public static class UsernameExtensions
    {
        /// <summary>
        /// Whether any login -- admin, physician or patient -- already uses
        /// <paramref name="username"/>.
        ///
        /// Each table has its own unique index on Username, but that is not
        /// enough: AuthController.Login looks the name up in Admins, then
        /// Physicians, then PatientAccounts and stops at the first hit, so a
        /// patient who shared an admin's username could never sign in. Every
        /// place that hands out a username checks here, not just its own table.
        ///
        /// Compared with the database's collation, the same way Login matches,
        /// so whatever Login would treat as the same name counts as taken.
        /// </summary>
        public static async Task<bool> IsUsernameTakenAsync(
            this ElectronicHealthRecordDbContext context,
            string username)
        {
            var name = username.Trim();

            return await context.Admins.AnyAsync(a => a.Username == name)
                || await context.Physicians.AnyAsync(p => p.Username == name)
                || await context.PatientAccounts.AnyAsync(a => a.Username == name);
        }
    }
}

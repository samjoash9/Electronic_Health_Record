using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <summary>
    /// Drops PasswordAlgo from both account tables. The column was redundant: a stored hash
    /// already identifies its own scheme -- 64 lowercase hex chars is the legacy unsalted SHA-256
    /// that DbSeeder writes, whereas PBKDF2 via PasswordHasher&lt;T&gt; is 84-char Base64 beginning
    /// "AQAAAA". Login can therefore still recognise a legacy hash and rewrite it in place.
    ///
    /// CK_Physician_CredentialSet is dropped and recreated because it named the column.
    /// </summary>
    public partial class RemovePasswordAlgo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "PasswordAlgo",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "PasswordAlgo",
                table: "Admin");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician",
                sql: "([Username] IS NULL AND [Email] IS NULL AND [PasswordHash] IS NULL) OR ([Username] IS NOT NULL AND [Email] IS NOT NULL AND [PasswordHash] IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician");

            migrationBuilder.AddColumn<string>(
                name: "PasswordAlgo",
                table: "Physician",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordAlgo",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "SHA256-LEGACY");

            // Physician.PasswordAlgo comes back nullable with no default, so every credentialed
            // physician would sit at NULL and violate the four-column constraint restored below.
            // Backfill from the hash itself, which is what made the column redundant in the first
            // place: 64 lowercase hex chars is the legacy SHA-256 format.
            migrationBuilder.Sql(@"
                UPDATE Physician
                   SET PasswordAlgo = CASE
                           WHEN LEN(PasswordHash) = 64 AND PasswordHash NOT LIKE '%[^0-9a-f]%'
                               THEN 'SHA256-LEGACY'
                           ELSE 'PBKDF2'
                       END
                 WHERE PasswordHash IS NOT NULL;");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician",
                sql: "([Username] IS NULL AND [Email] IS NULL AND [PasswordHash] IS NULL AND [PasswordAlgo] IS NULL) OR ([Username] IS NOT NULL AND [Email] IS NOT NULL AND [PasswordHash] IS NOT NULL AND [PasswordAlgo] IS NOT NULL)");
        }
    }
}

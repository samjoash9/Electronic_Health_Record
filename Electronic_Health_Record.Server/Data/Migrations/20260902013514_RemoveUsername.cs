using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUsername : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "UQ_Physician_Username",
                table: "Physician");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician");

            migrationBuilder.DropIndex(
                name: "IX_Admin_Username",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Admin");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician",
                sql: "([Email] IS NULL AND [PasswordHash] IS NULL) OR ([Email] IS NOT NULL AND [PasswordHash] IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician");

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Physician",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Admin",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "UQ_Physician_Username",
                table: "Physician",
                column: "Username",
                unique: true,
                filter: "[Username] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician",
                sql: "([Username] IS NULL AND [Email] IS NULL AND [PasswordHash] IS NULL) OR ([Username] IS NOT NULL AND [Email] IS NOT NULL AND [PasswordHash] IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_Admin_Username",
                table: "Admin",
                column: "Username",
                unique: true);
        }
    }
}

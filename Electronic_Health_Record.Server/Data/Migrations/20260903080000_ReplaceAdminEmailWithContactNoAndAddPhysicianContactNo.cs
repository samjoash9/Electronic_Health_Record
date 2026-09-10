using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceAdminEmailWithContactNoAndAddPhysicianContactNo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Admin.Email was never read anywhere in the app: no login path, no reset,
            // no notification. A phone number is what the office actually has on file,
            // so it replaces the column outright.
            migrationBuilder.DropIndex(
                name: "IX_Admin_Email",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Admin");

            // Not unique: shared office lines are normal.
            migrationBuilder.AddColumn<string>(
                name: "ContactNo",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);

            // Physicians had no contact field at all; Patient already carries this
            // shape, so it matches.
            migrationBuilder.AddColumn<string>(
                name: "ContactNo",
                table: "Physician",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactNo",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "ContactNo",
                table: "Admin");

            // Re-created as NOT NULL + unique, matching the original schema. Existing
            // rows get a placeholder derived from the username so the unique index can
            // be rebuilt; the original addresses are not recoverable from here.
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Admin",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE [Admin]
                SET [Email] = [Username] + '@invalid.local'
                WHERE [Email] IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Admin",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Admin_Email",
                table: "Admin",
                column: "Email",
                unique: true);
        }
    }
}

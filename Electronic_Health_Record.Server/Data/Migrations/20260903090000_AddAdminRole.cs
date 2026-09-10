using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Permission tier inside the Admin table. New rows default to "admin";
            // the check constraint is added after the backfill so existing rows
            // cannot violate it mid-migration.
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "admin");

            // Whoever already had an account was the only administrator, so they keep
            // full access rather than being silently demoted by the column default.
            migrationBuilder.Sql(@"
                UPDATE [Admin]
                SET [Role] = 'superadmin'
                WHERE [Username] = 'admin';");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Admin_Role",
                table: "Admin",
                sql: "Role IN ('admin', 'superadmin')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Admin_Role",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Admin");
        }
    }
}

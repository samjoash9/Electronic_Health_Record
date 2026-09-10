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
            // Permission tier inside the Admin table. The column and an equivalent
            // check constraint already exist from AddRoleBasedAccess, which spelled the
            // tiers 'Admin'/'SuperAdmin'. This migration is the one that settles the
            // lowercase spelling, so it drops that constraint, restates the column
            // default, backfills, and re-adds the constraint with the values the model
            // snapshot expects. (Both migrations added the column outright when this
            // branch was merged, which failed a from-scratch replay with "Column name
            // 'Role' in table 'Admin' is specified more than once".)
            migrationBuilder.DropCheckConstraint(
                name: "CK_Admin_Role",
                table: "Admin");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "admin",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldDefaultValue: "Admin");

            // Fold the earlier PascalCase tiers onto the lowercase spelling before the
            // constraint below can reject them.
            migrationBuilder.Sql(@"
                UPDATE [Admin]
                SET [Role] = LOWER([Role]);");

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

            // The column belongs to AddRoleBasedAccess, so restore its spelling and
            // default rather than dropping it.
            migrationBuilder.Sql(@"
                UPDATE [Admin]
                SET [Role] = CASE [Role]
                    WHEN 'superadmin' THEN 'SuperAdmin'
                    WHEN 'admin' THEN 'Admin'
                    ELSE [Role]
                END;");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "Admin",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldDefaultValue: "admin");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Admin_Role",
                table: "Admin",
                sql: "[Role] IN ('SuperAdmin','Admin')");
        }
    }
}

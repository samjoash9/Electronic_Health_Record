using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUsernamesToPhysicianAndPatientAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Physician and PatientAccount gain their own login handles, so all three
            // roles authenticate the same way. Both columns are NOT NULL + unique, so
            // each is added nullable, backfilled for existing rows, then tightened.
            //
            // Physician.Username/PasswordHash/IsActive/LastLoginAt are NOT added here:
            // AddRoleBasedAccess already created them as optional credential columns.
            // This migration only tightens them below. (They were added twice when this
            // branch was merged, which failed with "Column name 'Username' in table
            // 'Physician' is specified more than once" on a from-scratch replay.)
            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "PatientAccount",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            // Existing physicians get a handle derived from their PRC licence, which is
            // already unique and non-null, so the unique index below cannot collide.
            migrationBuilder.Sql(@"
                UPDATE [Physician]
                SET [Username] = LEFT(LOWER(REPLACE(REPLACE([PRCLicenseNo], '-', ''), ' ', '')), 30)
                WHERE [Username] IS NULL;");

            // No password survives this change: nobody could log in as a physician
            // before it, so there is nothing to preserve. An empty hash matches no
            // password, leaving each account disabled until one is set deliberately.
            migrationBuilder.Sql(@"
                UPDATE [Physician]
                SET [PasswordHash] = '', [IsActive] = 0
                WHERE [PasswordHash] IS NULL;");

            // Existing portal accounts key off the employee id they were provisioned
            // against, matching DbSeeder.UsernameFor.
            migrationBuilder.Sql(@"
                UPDATE pa
                SET pa.[Username] = LEFT(LOWER(REPLACE(REPLACE(p.[ExternalEmployeeId], '-', ''), ' ', '')), 30)
                FROM [PatientAccount] pa
                INNER JOIN [Patient] p ON p.[PatientID] = pa.[PatientID]
                WHERE pa.[Username] IS NULL;");

            // AddRoleBasedAccess put a filtered unique index on Username. SQL Server will
            // not alter a column an index depends on, and the "[Username] IS NOT NULL"
            // filter is meaningless once the column is NOT NULL, so it is dropped here and
            // replaced by the unfiltered IX_Physician_Username created below.
            migrationBuilder.DropIndex(
                name: "UQ_Physician_Username",
                table: "Physician");

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Physician",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Physician",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "PatientAccount",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Physician_Username",
                table: "Physician",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PatientAccount_Username",
                table: "PatientAccount",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PatientAccount_Username",
                table: "PatientAccount");

            migrationBuilder.DropIndex(
                name: "IX_Physician_Username",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "PatientAccount");

            // Physician credential columns belong to AddRoleBasedAccess, so they are
            // relaxed back to nullable here rather than dropped.
            migrationBuilder.AlterColumn<string>(
                name: "Username",
                table: "Physician",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30);

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Physician",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldMaxLength: 255);

            migrationBuilder.CreateIndex(
                name: "UQ_Physician_Username",
                table: "Physician",
                column: "Username",
                unique: true,
                filter: "[Username] IS NOT NULL");
        }
    }
}

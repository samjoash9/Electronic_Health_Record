using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordRotationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Accounts are onboarded with a password somebody else chose: the
            // superadmin issues one to an admin, an admin issues one to a doctor or a
            // patient. MustChangePassword marks an account that is still on that
            // issued password so the login flow can force a replacement, and the two
            // timestamps say when it was issued and when the holder last replaced it.

            // --- Admin -----------------------------------------------------------
            // Defaults to 1 so an account created by any path that forgets to set it
            // fails safe: worst case the holder is asked to change a password they
            // already own.
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Admin",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordSetAt",
                table: "Admin",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordChangedAt",
                table: "Admin",
                type: "datetime2",
                nullable: true);

            // Existing admins are development accounts already in use, so they keep
            // working rather than being locked behind a rotation prompt on the next
            // deploy. Newly onboarded rows still pick up the column default of 1.
            migrationBuilder.Sql(@"
                UPDATE [Admin]
                SET [MustChangePassword] = 0,
                    [PasswordSetAt] = [CreatedAt],
                    [PasswordChangedAt] = [CreatedAt];");

            // --- Physician -------------------------------------------------------
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Physician",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordSetAt",
                table: "Physician",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordChangedAt",
                table: "Physician",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE [Physician]
                SET [MustChangePassword] = 0,
                    [PasswordSetAt] = [CreatedAt],
                    [PasswordChangedAt] = [CreatedAt];");

            // --- PatientAccount --------------------------------------------------
            // Unlike the two staff tables this defaults to 0. A provisioned account
            // has no PasswordHash at all yet, so there is nothing to rotate until an
            // admin issues a default or resets an existing one.
            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "PatientAccount",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordSetAt",
                table: "PatientAccount",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordChangedAt",
                table: "PatientAccount",
                type: "datetime2",
                nullable: true);

            // Accounts that already have a password chose it themselves under the old
            // activation flow, so backfill the history from ActivatedAt. Provisioned
            // rows have no hash and keep both timestamps null.
            migrationBuilder.Sql(@"
                UPDATE [PatientAccount]
                SET [PasswordSetAt] = [ActivatedAt],
                    [PasswordChangedAt] = [ActivatedAt]
                WHERE [PasswordHash] IS NOT NULL;");

            // Added after the backfill so no existing row can violate it mid-migration.
            migrationBuilder.AddCheckConstraint(
                name: "CK_PatientAccount_MustChangePassword",
                table: "PatientAccount",
                sql: "MustChangePassword = 0 OR PasswordHash IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_PatientAccount_MustChangePassword",
                table: "PatientAccount");

            migrationBuilder.DropColumn(
                name: "PasswordChangedAt",
                table: "PatientAccount");

            migrationBuilder.DropColumn(
                name: "PasswordSetAt",
                table: "PatientAccount");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "PatientAccount");

            migrationBuilder.DropColumn(
                name: "PasswordChangedAt",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "PasswordSetAt",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "PasswordChangedAt",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "PasswordSetAt",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Admin");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <summary>
    /// Role-based access, database layer.
    ///
    /// Two parts of this migration are hand-written because the scaffolder got them wrong:
    ///
    ///  1. WellnessForm.PhysicianID holds the physician the form was ROUTED TO, so it is renamed
    ///     to AssignedPhysicianID and SignedByPhysicianID is added empty. The scaffolder guessed
    ///     the opposite -- renaming the existing column to SignedByPhysicianID -- which would have
    ///     wiped every form's assignment and invented a signer for forms nobody had signed.
    ///
    ///  2. The CHECK constraints are preceded by a data cleanup block. Without it, existing rows
    ///     with Status = 'Submitted' violate CK_WellnessForm_Status. DbSeeder runs MigrateAsync on
    ///     startup, so that failure would surface as the application refusing to boot.
    /// </summary>
    public partial class AddRoleBasedAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ---------------------------------------------------------------
            // 1. WellnessForm: split the single physician column into
            //    "who must sign" (renamed, keeps its data) and "who did sign" (new, empty)
            // ---------------------------------------------------------------
            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Physician_PhysicianID",
                table: "WellnessForm");

            migrationBuilder.RenameColumn(
                name: "PhysicianID",
                table: "WellnessForm",
                newName: "AssignedPhysicianID");

            migrationBuilder.RenameIndex(
                name: "IX_WellnessForm_PhysicianID",
                table: "WellnessForm",
                newName: "IX_WellnessForm_AssignedPhysicianID");

            migrationBuilder.AddColumn<int>(
                name: "SignedByPhysicianID",
                table: "WellnessForm",
                type: "int",
                nullable: true);

            // ---------------------------------------------------------------
            // 2. Admin: role discriminator + password-scheme marker
            // ---------------------------------------------------------------
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "Admin");

            migrationBuilder.AddColumn<string>(
                name: "PasswordAlgo",
                table: "Admin",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "SHA256-LEGACY");

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Admin",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // ---------------------------------------------------------------
            // 3. Physician: optional login credentials.
            //    All nullable, so every existing directory row stays valid.
            // ---------------------------------------------------------------
            migrationBuilder.AddColumn<string>(
                name: "Username",
                table: "Physician",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Physician",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "Physician",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PasswordAlgo",
                table: "Physician",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Physician",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "Physician",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "Physician",
                type: "datetime2",
                nullable: true);

            // ---------------------------------------------------------------
            // 4. AdminSession -> UserSession.
            //    Dropped and recreated rather than altered: the table has never been written to
            //    (no code has ever touched it), so there is nothing to preserve, and AdminID has
            //    to become nullable to make room for a physician principal.
            // ---------------------------------------------------------------
            migrationBuilder.DropTable(
                name: "AdminSession");

            migrationBuilder.CreateTable(
                name: "UserSession",
                columns: table => new
                {
                    SessionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdminID = table.Column<int>(type: "int", nullable: true),
                    PhysicianID = table.Column<int>(type: "int", nullable: true),
                    TokenHash = table.Column<string>(type: "char(64)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSession", x => x.SessionID);
                    // spelled out longhand because T-SQL has no boolean type: the natural
                    // "([AdminID] IS NULL) <> ([PhysicianID] IS NULL)" cannot compare two predicates
                    table.CheckConstraint("CK_UserSession_ExactlyOnePrincipal", "([AdminID] IS NOT NULL AND [PhysicianID] IS NULL) OR ([AdminID] IS NULL AND [PhysicianID] IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_UserSession_Admin_AdminID",
                        column: x => x.AdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserSession_Physician_PhysicianID",
                        column: x => x.PhysicianID,
                        principalTable: "Physician",
                        principalColumn: "PhysicianID",
                        onDelete: ReferentialAction.Restrict);
                });

            // ---------------------------------------------------------------
            // 5. DATA CLEANUP -- must run before any CHECK constraint below.
            //    Order matters: rename the old status value first, otherwise step (c) would
            //    flatten every 'Submitted' row to Draft and lose its physician assignment.
            // ---------------------------------------------------------------

            // (a) the old wire value becomes the new "awaiting signature" state
            migrationBuilder.Sql(@"
                UPDATE WellnessForm SET Status = 'PendingSignature' WHERE Status = 'Submitted';");

            // (b) a row that already carries a signature and a timestamp IS a signed record --
            //     promote it and record its signer. This is what the seeded demo form is.
            migrationBuilder.Sql(@"
                UPDATE WellnessForm
                   SET SignedByPhysicianID = AssignedPhysicianID,
                       Status              = 'Signed'
                 WHERE Status = 'PendingSignature'
                   AND Signature           IS NOT NULL
                   AND SignedAt            IS NOT NULL
                   AND AssignedPhysicianID IS NOT NULL;");

            // (c) anything outside the new domain falls back to Draft
            migrationBuilder.Sql(@"
                UPDATE WellnessForm SET Status = 'Draft'
                 WHERE Status NOT IN ('Draft','PendingSignature','Signed');");

            // (d) a non-Draft form with nobody assigned cannot exist under the new model
            migrationBuilder.Sql(@"
                UPDATE WellnessForm SET Status = 'Draft'
                 WHERE Status <> 'Draft' AND AssignedPhysicianID IS NULL;");

            // (e) a Draft must not carry signature remnants
            migrationBuilder.Sql(@"
                UPDATE WellnessForm
                   SET Signature = NULL, SignedAt = NULL, SignedByPhysicianID = NULL
                 WHERE Status = 'Draft';");

            // (f) belt and braces on the two Admin domains
            migrationBuilder.Sql(@"
                UPDATE [Admin] SET PasswordAlgo = 'SHA256-LEGACY'
                 WHERE PasswordAlgo IS NULL OR PasswordAlgo = '';");
            migrationBuilder.Sql(@"
                UPDATE [Admin] SET Role = 'Admin'
                 WHERE Role NOT IN ('SuperAdmin','Admin');");

            // ---------------------------------------------------------------
            // 6. Indexes
            // ---------------------------------------------------------------
            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_SignedByPhysicianID",
                table: "WellnessForm",
                column: "SignedByPhysicianID");

            // serves the physician's "awaiting my signature" queue
            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_Status_AssignedPhysicianID",
                table: "WellnessForm",
                columns: new[] { "Status", "AssignedPhysicianID" });

            // filtered so that many credential-less directory rows do not collide on NULL
            migrationBuilder.CreateIndex(
                name: "UQ_Physician_Username",
                table: "Physician",
                column: "Username",
                unique: true,
                filter: "[Username] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "UQ_Physician_Email",
                table: "Physician",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_AdminID",
                table: "UserSession",
                column: "AdminID");

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_PhysicianID",
                table: "UserSession",
                column: "PhysicianID");

            migrationBuilder.CreateIndex(
                name: "IX_UserSession_TokenHash",
                table: "UserSession",
                column: "TokenHash",
                unique: true);

            // ---------------------------------------------------------------
            // 7. CHECK constraints -- last, now that the data satisfies them
            // ---------------------------------------------------------------

            // 'Physician' is deliberately absent: physicians are a separate table, so no staff
            // account can ever present a physicianId claim to the signing endpoint
            migrationBuilder.AddCheckConstraint(
                name: "CK_Admin_Role",
                table: "Admin",
                sql: "[Role] IN ('SuperAdmin','Admin')");

            // a physician row is a directory entry or a login account, never half of one
            migrationBuilder.AddCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician",
                sql: "([Username] IS NULL AND [Email] IS NULL AND [PasswordHash] IS NULL AND [PasswordAlgo] IS NULL) OR ([Username] IS NOT NULL AND [Email] IS NOT NULL AND [PasswordHash] IS NOT NULL AND [PasswordAlgo] IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm",
                sql: "[Status] IN ('Draft','PendingSignature','Signed')");

            // once a form leaves Draft it has been routed to a named physician
            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_AssignedWhenPending",
                table: "WellnessForm",
                sql: "[Status] = 'Draft' OR [AssignedPhysicianID] IS NOT NULL");

            // a signed form carries assignee, signer, signature and timestamp together, or none:
            // a partial write cannot fabricate an attestation
            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_SignedIntegrity",
                table: "WellnessForm",
                sql: "[Status] <> 'Signed' OR ([AssignedPhysicianID] IS NOT NULL AND [SignedByPhysicianID] IS NOT NULL AND [Signature] IS NOT NULL AND [SignedAt] IS NOT NULL)");

            // ---------------------------------------------------------------
            // 8. Foreign keys
            // ---------------------------------------------------------------
            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Physician_AssignedPhysicianID",
                table: "WellnessForm",
                column: "AssignedPhysicianID",
                principalTable: "Physician",
                principalColumn: "PhysicianID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Physician_SignedByPhysicianID",
                table: "WellnessForm",
                column: "SignedByPhysicianID",
                principalTable: "Physician",
                principalColumn: "PhysicianID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // constraints and keys first, so the data revert below cannot trip over them
            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Physician_AssignedPhysicianID",
                table: "WellnessForm");

            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Physician_SignedByPhysicianID",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_SignedIntegrity",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_AssignedWhenPending",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Physician_CredentialSet",
                table: "Physician");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Admin_Role",
                table: "Admin");

            migrationBuilder.DropTable(
                name: "UserSession");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_Status_AssignedPhysicianID",
                table: "WellnessForm");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_SignedByPhysicianID",
                table: "WellnessForm");

            migrationBuilder.DropIndex(
                name: "UQ_Physician_Email",
                table: "Physician");

            migrationBuilder.DropIndex(
                name: "UQ_Physician_Username",
                table: "Physician");

            // collapse the three-state lifecycle back to the old two values
            migrationBuilder.Sql(@"
                UPDATE WellnessForm SET Status = 'Submitted'
                 WHERE Status IN ('PendingSignature','Signed');");

            migrationBuilder.DropColumn(
                name: "SignedByPhysicianID",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "PasswordAlgo",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "Username",
                table: "Physician");

            migrationBuilder.DropColumn(
                name: "MustChangePassword",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "PasswordAlgo",
                table: "Admin");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "Admin");

            migrationBuilder.RenameColumn(
                name: "AssignedPhysicianID",
                table: "WellnessForm",
                newName: "PhysicianID");

            migrationBuilder.RenameIndex(
                name: "IX_WellnessForm_AssignedPhysicianID",
                table: "WellnessForm",
                newName: "IX_WellnessForm_PhysicianID");

            migrationBuilder.CreateTable(
                name: "AdminSession",
                columns: table => new
                {
                    SessionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdminID = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TokenHash = table.Column<string>(type: "char(64)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdminSession", x => x.SessionID);
                    table.ForeignKey(
                        name: "FK_AdminSession_Admin_AdminID",
                        column: x => x.AdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AdminSession_AdminID",
                table: "AdminSession",
                column: "AdminID");

            migrationBuilder.CreateIndex(
                name: "IX_AdminSession_TokenHash",
                table: "AdminSession",
                column: "TokenHash",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Physician_PhysicianID",
                table: "WellnessForm",
                column: "PhysicianID",
                principalTable: "Physician",
                principalColumn: "PhysicianID",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

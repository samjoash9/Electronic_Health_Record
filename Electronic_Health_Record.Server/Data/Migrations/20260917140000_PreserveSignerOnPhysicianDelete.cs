using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <summary>
    /// Lets a superadmin delete a physician account without destroying the
    /// attribution on records that physician signed.
    ///
    /// A signed form referenced the practitioner only by FK, and
    /// CK_WellnessForm_CompletedIsSigned required that FK to be present on any
    /// completed form -- so the account could never be removed without either
    /// breaking the constraint or leaving the record unattributable.
    ///
    /// Each signature now carries the signer's name and PRC licence as text,
    /// captured at signing time, and the three constraints accept either the
    /// live FK or that snapshot. DeletePhysician backfills the snapshot, nulls
    /// the three ids, then deletes the row.
    /// </summary>
    public partial class PreserveSignerOnPhysicianDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SignedByName",
                table: "WellnessForm",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SignedByLicenseNo",
                table: "WellnessForm",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DentalSignedByName",
                table: "WellnessForm",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DentalSignedByLicenseNo",
                table: "WellnessForm",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisionSignedByName",
                table: "WellnessForm",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisionSignedByLicenseNo",
                table: "WellnessForm",
                type: "varchar(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            // Backfill from the still-present physician rows, so records signed
            // before this migration are attributable by name too. Without this,
            // only forms signed from now on would survive a delete.
            migrationBuilder.Sql(@"
UPDATE f
SET f.SignedByName = CONCAT('Dr. ', p.FirstName, ' ',
        CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(p.MiddleName, ''))), '') IS NULL
             THEN '' ELSE p.MiddleName + ' ' END,
        p.Surname),
    f.SignedByLicenseNo = p.PRCLicenseNo
FROM WellnessForm AS f
JOIN Physician AS p ON p.PhysicianID = f.PhysicianID
WHERE f.PhysicianID IS NOT NULL AND f.SignedByName IS NULL;
");

            migrationBuilder.Sql(@"
UPDATE f
SET f.DentalSignedByName = CONCAT('Dr. ', p.FirstName, ' ',
        CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(p.MiddleName, ''))), '') IS NULL
             THEN '' ELSE p.MiddleName + ' ' END,
        p.Surname),
    f.DentalSignedByLicenseNo = p.PRCLicenseNo
FROM WellnessForm AS f
JOIN Physician AS p ON p.PhysicianID = f.DentistID
WHERE f.DentistID IS NOT NULL AND f.DentalSignedByName IS NULL;
");

            migrationBuilder.Sql(@"
UPDATE f
SET f.VisionSignedByName = CONCAT('Dr. ', p.FirstName, ' ',
        CASE WHEN NULLIF(LTRIM(RTRIM(ISNULL(p.MiddleName, ''))), '') IS NULL
             THEN '' ELSE p.MiddleName + ' ' END,
        p.Surname),
    f.VisionSignedByLicenseNo = p.PRCLicenseNo
FROM WellnessForm AS f
JOIN Physician AS p ON p.PhysicianID = f.OptometristID
WHERE f.OptometristID IS NOT NULL AND f.VisionSignedByName IS NULL;
");

            // Each constraint now accepts the name snapshot in place of the FK.
            // Signature and SignedAt are still required: only the *identity* of
            // the signer may come from the snapshot, never the signature itself.
            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsSigned",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR ((PhysicianID IS NOT NULL OR SignedByName IS NOT NULL) AND Signature IS NOT NULL AND SignedAt IS NOT NULL)");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsDentalSigned",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsDentalSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR CurrentStation < 4 OR ((DentistID IS NOT NULL OR DentalSignedByName IS NOT NULL) AND DentalSignature IS NOT NULL AND DentalSignedAt IS NOT NULL)");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsVisionSigned",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsVisionSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR CurrentStation < 5 OR ((OptometristID IS NOT NULL OR VisionSignedByName IS NOT NULL) AND VisionSignature IS NOT NULL AND VisionSignedAt IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reverting re-requires the FK on every completed form. A form whose
            // physician was deleted while this migration was applied has no FK to
            // restore, so the original constraint would reject it -- those rows
            // have to be reassigned by hand before rolling back.
            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsVisionSigned",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsVisionSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR CurrentStation < 5 OR (OptometristID IS NOT NULL AND VisionSignature IS NOT NULL AND VisionSignedAt IS NOT NULL)");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsDentalSigned",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsDentalSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR CurrentStation < 4 OR (DentistID IS NOT NULL AND DentalSignature IS NOT NULL AND DentalSignedAt IS NOT NULL)");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsSigned",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR (PhysicianID IS NOT NULL AND Signature IS NOT NULL AND SignedAt IS NOT NULL)");

            migrationBuilder.DropColumn(name: "VisionSignedByLicenseNo", table: "WellnessForm");
            migrationBuilder.DropColumn(name: "VisionSignedByName", table: "WellnessForm");
            migrationBuilder.DropColumn(name: "DentalSignedByLicenseNo", table: "WellnessForm");
            migrationBuilder.DropColumn(name: "DentalSignedByName", table: "WellnessForm");
            migrationBuilder.DropColumn(name: "SignedByLicenseNo", table: "WellnessForm");
            migrationBuilder.DropColumn(name: "SignedByName", table: "WellnessForm");
        }
    }
}

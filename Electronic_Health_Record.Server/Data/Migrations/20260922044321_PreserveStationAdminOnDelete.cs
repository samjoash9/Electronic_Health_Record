using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <summary>
    /// Lets a superadmin delete a staff account without destroying the
    /// attribution on records that account filled.
    ///
    /// Station 1 and Station 2 recorded the admin who took the vitals and ran
    /// the assessment only by FK, so deleting the account would have left those
    /// forms unattributable. Each station now carries the admin's name as text,
    /// captured at submit time and backfilled here for existing rows.
    ///
    /// The FKs deliberately stay Restrict. SQL Server permits only one
    /// ON DELETE SET NULL path from WellnessForm to Admin, and
    /// CreatedByAdminID already holds it -- adding more raises error 1785
    /// ("may cause cycles or multiple cascade paths"). DeleteAdmin nulls every
    /// admin id itself inside one transaction, so the cascade is redundant and
    /// Restrict remains the backstop. Mirrors PreserveSignerOnPhysicianDelete.
    /// </summary>
    public partial class PreserveStationAdminOnDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Station1AdminName",
                table: "WellnessForm",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Station2AdminName",
                table: "WellnessForm",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            // Backfill from the still-present admin rows, so records filled
            // before this migration are attributable by name too. Without this,
            // only forms submitted from now on would survive a delete.
            migrationBuilder.Sql(@"
UPDATE f
SET f.Station1AdminName = a.FullName
FROM WellnessForm AS f
JOIN Admin AS a ON a.AdminID = f.Station1AdminID
WHERE f.Station1AdminID IS NOT NULL AND f.Station1AdminName IS NULL;
");

            migrationBuilder.Sql(@"
UPDATE f
SET f.Station2AdminName = a.FullName
FROM WellnessForm AS f
JOIN Admin AS a ON a.AdminID = f.Station2AdminID
WHERE f.Station2AdminID IS NOT NULL AND f.Station2AdminName IS NULL;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Station1AdminName",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station2AdminName",
                table: "WellnessForm");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <summary>
    /// Extends AddStation2StartedAt to the doctor desks: when the Station 3,
    /// 4 and 5 pages were first opened for a form, so each queue can show
    /// which patients a doctor is already working on. Nullable with no
    /// backfill, same as Station2StartedAt.
    /// </summary>
    public partial class AddStation3To5StartedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Station3StartedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station4StartedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station5StartedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Station3StartedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station4StartedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station5StartedAt",
                table: "WellnessForm");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <summary>
    /// Records when the Station 2 kiosk was first opened for a form, so the
    /// Station 2 queue can show which patients are answering and which have
    /// not been handed a tablet yet. Nullable with no backfill: existing forms
    /// read as "not yet answered" until their kiosk is opened again.
    /// </summary>
    public partial class AddStation2StartedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "Station2StartedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Station2StartedAt",
                table: "WellnessForm");
        }
    }
}

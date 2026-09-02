using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActivityLog",
                columns: table => new
                {
                    LogID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Action = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FormID = table.Column<int>(type: "int", nullable: true),
                    ActorID = table.Column<int>(type: "int", nullable: false),
                    ActorRole = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false, defaultValue: "SUCCESS"),
                    IsViewed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityLog", x => x.LogID);
                    table.CheckConstraint("CK_ActivityLog_ActorRole", "[ActorRole] IN ('SuperAdmin','Admin','Physician')");
                    table.CheckConstraint("CK_ActivityLog_Status", "[Status] IN ('SUCCESS','FAILED','WARNING')");
                    table.ForeignKey(
                        name: "FK_ActivityLog_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLog_CreatedAt",
                table: "ActivityLog",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLog_FormID",
                table: "ActivityLog",
                column: "FormID");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLog_IsViewed",
                table: "ActivityLog",
                column: "IsViewed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityLog");
        }
    }
}

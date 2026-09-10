using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 7);

            migrationBuilder.DropColumn(
                name: "ExerciseFrequency",
                table: "SocialHistory");

            migrationBuilder.DropColumn(
                name: "ExerciseType",
                table: "SocialHistory");

            migrationBuilder.CreateTable(
                name: "Exercise",
                columns: table => new
                {
                    ExerciseID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    ExerciseType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ExerciseFrequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ExerciseYearStarted = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercise", x => x.ExerciseID);
                    table.ForeignKey(
                        name: "FK_Exercise_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 3,
                column: "ConditionName",
                value: "MENTAL HEALTH CONDITION");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 6,
                column: "ConditionName",
                value: "RESPIRATORY ILLNESS");

            migrationBuilder.InsertData(
                table: "MedicalCondition",
                columns: new[] { "ConditionID", "ConditionName", "ConditionType" },
                values: new object[,]
                {
                    { 8, "KIDNEY DISEASE", null },
                    { 9, "LIVER DISEASE", null },
                    { 10, "ARTHRITIS", null },
                    { 11, "REPRODUCTIVE HEALTH PROBLEM", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Exercise_FormID",
                table: "Exercise",
                column: "FormID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Exercise");

            migrationBuilder.DeleteData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 11);

            migrationBuilder.AddColumn<string>(
                name: "ExerciseFrequency",
                table: "SocialHistory",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExerciseType",
                table: "SocialHistory",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 3,
                column: "ConditionName",
                value: "STROKE");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 6,
                column: "ConditionName",
                value: "TUBERCULOSIS");

            migrationBuilder.InsertData(
                table: "MedicalCondition",
                columns: new[] { "ConditionID", "ConditionName", "ConditionType" },
                values: new object[] { 7, "BRONCHIAL ASTHMA", null });
        }
    }
}

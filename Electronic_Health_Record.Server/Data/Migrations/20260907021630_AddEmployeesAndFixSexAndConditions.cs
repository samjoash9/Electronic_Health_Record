using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeesAndFixSexAndConditions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Sex",
                table: "Patient",
                type: "varchar(10)",
                unicode: false,
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "char(1)");

            // Widening char(1) to varchar(10) does not rewrite existing values --
            // a row already storing 'M' stays 'M', it does not become 'Male'. The
            // client only ever sends/expects the full word (SEX_OPTIONS in
            // src/lib/constants.js), so any row seeded before this migration must
            // be backfilled or it renders as a literal "M"/"F" in the UI.
            migrationBuilder.Sql(
                "UPDATE [Patient] SET [Sex] = 'Male' WHERE [Sex] = 'M';" +
                "UPDATE [Patient] SET [Sex] = 'Female' WHERE [Sex] = 'F';");

            migrationBuilder.CreateTable(
                name: "Employee",
                columns: table => new
                {
                    EmployeeID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExternalEmployeeId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Surname = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Birthdate = table.Column<DateTime>(type: "date", nullable: false),
                    Sex = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    CivilStatus = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    AgencyOffice = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Position = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ContactNo = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employee", x => x.EmployeeID);
                });

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 1,
                column: "ConditionName",
                value: "NONE");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 2,
                column: "ConditionName",
                value: "HYPERTENSION (Heart Attack)");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 3,
                column: "ConditionName",
                value: "STROKE");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 4,
                column: "ConditionName",
                value: "DIABETES MELLITUS");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 5,
                column: "ConditionName",
                value: "CANCER (Breast/Ovarian/Colon, etc.)");

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

            migrationBuilder.CreateIndex(
                name: "IX_Employee_ExternalEmployeeId",
                table: "Employee",
                column: "ExternalEmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employee_Surname_FirstName",
                table: "Employee",
                columns: new[] { "Surname", "FirstName" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Employee");

            migrationBuilder.DeleteData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 7);

            migrationBuilder.AlterColumn<string>(
                name: "Sex",
                table: "Patient",
                type: "char(1)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(10)",
                oldUnicode: false,
                oldMaxLength: 10);

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 1,
                column: "ConditionName",
                value: "Hypertension");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 2,
                column: "ConditionName",
                value: "Stroke");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 3,
                column: "ConditionName",
                value: "Diabetes Mellitus");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 4,
                column: "ConditionName",
                value: "Tuberculosis");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 5,
                column: "ConditionName",
                value: "Bronchial Asthma");

            migrationBuilder.UpdateData(
                table: "MedicalCondition",
                keyColumn: "ConditionID",
                keyValue: 6,
                column: "ConditionName",
                value: "Cancer");
        }
    }
}

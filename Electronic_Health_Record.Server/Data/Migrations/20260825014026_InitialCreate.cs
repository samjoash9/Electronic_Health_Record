using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Admin",
                columns: table => new
                {
                    AdminID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admin", x => x.AdminID);
                });

            migrationBuilder.CreateTable(
                name: "MedicalCondition",
                columns: table => new
                {
                    ConditionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConditionName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ConditionType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicalCondition", x => x.ConditionID);
                });

            migrationBuilder.CreateTable(
                name: "Patient",
                columns: table => new
                {
                    PatientID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Surname = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Birthdate = table.Column<DateTime>(type: "date", nullable: false),
                    Sex = table.Column<string>(type: "char(1)", nullable: false),
                    CivilStatus = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    AgencyOffice = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Position = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ContactNo = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Patient", x => x.PatientID);
                });

            migrationBuilder.CreateTable(
                name: "Physician",
                columns: table => new
                {
                    PhysicianID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Surname = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    MiddleName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PRCLicenseNo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Physician", x => x.PhysicianID);
                });

            migrationBuilder.CreateTable(
                name: "AdminSession",
                columns: table => new
                {
                    SessionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AdminID = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "char(64)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
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

            migrationBuilder.CreateTable(
                name: "WellnessForm",
                columns: table => new
                {
                    FormID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientID = table.Column<int>(type: "int", nullable: false),
                    PhysicianID = table.Column<int>(type: "int", nullable: false),
                    FormDate = table.Column<DateTime>(type: "date", nullable: false, defaultValueSql: "CAST(SYSDATETIME() AS date)"),
                    WeightKg = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    HeightCm = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    BMI = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    IdealBMI = table.Column<decimal>(type: "decimal(5,2)", precision: 5, scale: 2, nullable: true),
                    BPSystolic = table.Column<short>(type: "smallint", nullable: true),
                    BPDiastolic = table.Column<short>(type: "smallint", nullable: true),
                    TempCelsius = table.Column<decimal>(type: "decimal(3,1)", precision: 3, scale: 1, nullable: true),
                    HeartRate = table.Column<short>(type: "smallint", nullable: true),
                    RespRate = table.Column<short>(type: "smallint", nullable: true),
                    RecommendedDiagnosticTest = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    ImpressionClinical = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ManagementTreatment = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedByAdminID = table.Column<int>(type: "int", nullable: true),
                    UpdatedByAdminID = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WellnessForm", x => x.FormID);
                    table.ForeignKey(
                        name: "FK_WellnessForm_Admin_CreatedByAdminID",
                        column: x => x.CreatedByAdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WellnessForm_Admin_UpdatedByAdminID",
                        column: x => x.UpdatedByAdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WellnessForm_Patient_PatientID",
                        column: x => x.PatientID,
                        principalTable: "Patient",
                        principalColumn: "PatientID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WellnessForm_Physician_PhysicianID",
                        column: x => x.PhysicianID,
                        principalTable: "Physician",
                        principalColumn: "PhysicianID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FamilyMedicalHistory",
                columns: table => new
                {
                    FMHID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    ConditionID = table.Column<int>(type: "int", nullable: true),
                    ConditionOther = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    IsNone = table.Column<bool>(type: "bit", nullable: true, defaultValue: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyMedicalHistory", x => x.FMHID);
                    table.ForeignKey(
                        name: "FK_FamilyMedicalHistory_MedicalCondition_ConditionID",
                        column: x => x.ConditionID,
                        principalTable: "MedicalCondition",
                        principalColumn: "ConditionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FamilyMedicalHistory_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PastMedicalHistory",
                columns: table => new
                {
                    PMHID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    ConditionID = table.Column<int>(type: "int", nullable: true),
                    ConditionOther = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    YearDiagnosed = table.Column<short>(type: "smallint", nullable: true),
                    MaintenanceDrugGeneric = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Dosage = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Frequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PastMedicalHistory", x => x.PMHID);
                    table.ForeignKey(
                        name: "FK_PastMedicalHistory_MedicalCondition_ConditionID",
                        column: x => x.ConditionID,
                        principalTable: "MedicalCondition",
                        principalColumn: "ConditionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PastMedicalHistory_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SocialHistory",
                columns: table => new
                {
                    SocialHistoryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    SmokingSticksPerDay = table.Column<short>(type: "smallint", nullable: true),
                    AlcoholType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DrinkFrequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DrinksPerSession = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    HasBeenDrunk = table.Column<bool>(type: "bit", nullable: true),
                    DrunkFrequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ExerciseFrequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ExerciseType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialHistory", x => x.SocialHistoryID);
                    table.ForeignKey(
                        name: "FK_SocialHistory_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Admin_Email",
                table: "Admin",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Admin_Username",
                table: "Admin",
                column: "Username",
                unique: true);

            migrationBuilder.InsertData(
                table: "MedicalCondition",
                columns: new[] { "ConditionID", "ConditionName", "ConditionType" },
                values: new object[,]
                {
                    { 1, "Hypertension", null },
                    { 2, "Stroke", null },
                    { 3, "Diabetes Mellitus", null },
                    { 4, "Tuberculosis", null },
                    { 5, "Bronchial Asthma", null },
                    { 6, "Cancer", null }
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

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMedicalHistory_ConditionID",
                table: "FamilyMedicalHistory",
                column: "ConditionID");

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMedicalHistory_FormID",
                table: "FamilyMedicalHistory",
                column: "FormID");

            migrationBuilder.CreateIndex(
                name: "IX_MedicalCondition_ConditionName",
                table: "MedicalCondition",
                column: "ConditionName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PastMedicalHistory_ConditionID",
                table: "PastMedicalHistory",
                column: "ConditionID");

            migrationBuilder.CreateIndex(
                name: "IX_PastMedicalHistory_FormID",
                table: "PastMedicalHistory",
                column: "FormID");

            migrationBuilder.CreateIndex(
                name: "IX_Physician_PRCLicenseNo",
                table: "Physician",
                column: "PRCLicenseNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialHistory_FormID",
                table: "SocialHistory",
                column: "FormID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_CreatedByAdminID",
                table: "WellnessForm",
                column: "CreatedByAdminID");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_PatientID",
                table: "WellnessForm",
                column: "PatientID");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_PhysicianID",
                table: "WellnessForm",
                column: "PhysicianID");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_UpdatedByAdminID",
                table: "WellnessForm",
                column: "UpdatedByAdminID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdminSession");

            migrationBuilder.DropTable(
                name: "FamilyMedicalHistory");

            migrationBuilder.DropTable(
                name: "PastMedicalHistory");

            migrationBuilder.DropTable(
                name: "SocialHistory");

            migrationBuilder.DropTable(
                name: "MedicalCondition");

            migrationBuilder.DropTable(
                name: "WellnessForm");

            migrationBuilder.DropTable(
                name: "Admin");

            migrationBuilder.DropTable(
                name: "Patient");

            migrationBuilder.DropTable(
                name: "Physician");
        }
    }
}

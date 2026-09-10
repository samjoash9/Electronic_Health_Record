using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStationWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_PatientID",
                table: "WellnessForm");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "WellnessForm",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "PendingAssessment",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldDefaultValue: "Draft");

            migrationBuilder.AlterColumn<string>(
                name: "RecommendedDiagnosticTest",
                table: "WellnessForm",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ManagementTreatment",
                table: "WellnessForm",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(300)",
                oldMaxLength: 300,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImpressionClinical",
                table: "WellnessForm",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(300)",
                oldMaxLength: 300,
                oldNullable: true);

            migrationBuilder.AddColumn<byte>(
                name: "CurrentStation",
                table: "WellnessForm",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)1);

            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "WellnessForm",
                type: "rowversion",
                rowVersion: true,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Station1AdminID",
                table: "WellnessForm",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station1SubmittedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Station2AdminID",
                table: "WellnessForm",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station2SubmittedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station3SubmittedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalEmployeeId",
                table: "Patient",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastSyncedAt",
                table: "Patient",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSDATETIME()");

            migrationBuilder.AddColumn<string>(
                name: "FamilyMembers",
                table: "FamilyMedicalHistory",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AssessmentCategory",
                columns: table => new
                {
                    CategoryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DisplayOrder = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentCategory", x => x.CategoryID);
                });

            migrationBuilder.CreateTable(
                name: "PatientAccount",
                columns: table => new
                {
                    PatientAccountID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientID = table.Column<int>(type: "int", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "Provisioned"),
                    ProvisionedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    ActivatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientAccount", x => x.PatientAccountID);
                    table.CheckConstraint("CK_PatientAccount_Activation", "Status <> 'Active' OR (PasswordHash IS NOT NULL AND ActivatedAt IS NOT NULL)");
                    table.ForeignKey(
                        name: "FK_PatientAccount_Patient_PatientID",
                        column: x => x.PatientID,
                        principalTable: "Patient",
                        principalColumn: "PatientID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PhysicianSession",
                columns: table => new
                {
                    SessionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PhysicianID = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "char(64)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhysicianSession", x => x.SessionID);
                    table.ForeignKey(
                        name: "FK_PhysicianSession_Physician_PhysicianID",
                        column: x => x.PhysicianID,
                        principalTable: "Physician",
                        principalColumn: "PhysicianID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WellnessFormAuditLog",
                columns: table => new
                {
                    LogID = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    ActorType = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    ActorID = table.Column<int>(type: "int", nullable: true),
                    Action = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    OccurredAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WellnessFormAuditLog", x => x.LogID);
                    table.CheckConstraint("CK_WellnessFormAuditLog_ActorType", "ActorType IN ('Admin', 'Physician', 'Patient', 'System')");
                    table.ForeignKey(
                        name: "FK_WellnessFormAuditLog_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentQuestion",
                columns: table => new
                {
                    QuestionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CategoryID = table.Column<int>(type: "int", nullable: false),
                    QuestionText = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    DisplayOrder = table.Column<byte>(type: "tinyint", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentQuestion", x => x.QuestionID);
                    table.ForeignKey(
                        name: "FK_AssessmentQuestion_AssessmentCategory_CategoryID",
                        column: x => x.CategoryID,
                        principalTable: "AssessmentCategory",
                        principalColumn: "CategoryID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PatientSession",
                columns: table => new
                {
                    SessionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PatientAccountID = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "char(64)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PatientSession", x => x.SessionID);
                    table.ForeignKey(
                        name: "FK_PatientSession_PatientAccount_PatientAccountID",
                        column: x => x.PatientAccountID,
                        principalTable: "PatientAccount",
                        principalColumn: "PatientAccountID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentOption",
                columns: table => new
                {
                    OptionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuestionID = table.Column<int>(type: "int", nullable: false),
                    OptionText = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Score = table.Column<byte>(type: "tinyint", nullable: false),
                    DisplayOrder = table.Column<byte>(type: "tinyint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentOption", x => x.OptionID);
                    table.CheckConstraint("CK_AssessmentOption_Score", "Score BETWEEN 1 AND 4");
                    table.ForeignKey(
                        name: "FK_AssessmentOption_AssessmentQuestion_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "AssessmentQuestion",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AssessmentAnswer",
                columns: table => new
                {
                    AnswerID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    QuestionID = table.Column<int>(type: "int", nullable: false),
                    OptionID = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentAnswer", x => x.AnswerID);
                    table.ForeignKey(
                        name: "FK_AssessmentAnswer_AssessmentOption_OptionID",
                        column: x => x.OptionID,
                        principalTable: "AssessmentOption",
                        principalColumn: "OptionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssessmentAnswer_AssessmentQuestion_QuestionID",
                        column: x => x.QuestionID,
                        principalTable: "AssessmentQuestion",
                        principalColumn: "QuestionID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AssessmentAnswer_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "AssessmentCategory",
                columns: new[] { "CategoryID", "DisplayOrder", "Name" },
                values: new object[,]
                {
                    { 1, (byte)1, "Mental Health" },
                    { 2, (byte)2, "Physical Health" },
                    { 3, (byte)3, "Spiritual Health" },
                    { 4, (byte)4, "Social Health" }
                });

            migrationBuilder.InsertData(
                table: "AssessmentQuestion",
                columns: new[] { "QuestionID", "CategoryID", "DisplayOrder", "IsActive", "QuestionText" },
                values: new object[,]
                {
                    { 1, 1, (byte)1, true, "How would you rate your current stress level?" },
                    { 2, 1, (byte)2, true, "How many hours of sleep do you get on average?" },
                    { 3, 1, (byte)3, true, "How would you describe your general mood lately?" },
                    { 4, 1, (byte)4, true, "Do you experience frequent anxiety or worry?" },
                    { 5, 1, (byte)5, true, "Do you have difficulty concentrating or focusing?" },
                    { 6, 2, (byte)1, true, "Do you experience any chronic pain?" },
                    { 7, 2, (byte)2, true, "How often do you feel fatigued during the day?" },
                    { 8, 2, (byte)3, true, "How is your appetite?" },
                    { 9, 2, (byte)4, true, "How regular are your bowel movements?" },
                    { 10, 2, (byte)5, true, "Do you experience any urinary problems?" },
                    { 11, 3, (byte)1, true, "Do you have a clear sense of purpose in life?" },
                    { 12, 3, (byte)2, true, "Do you feel inner peace most of the time?" },
                    { 13, 3, (byte)3, true, "Do you regularly practice gratitude?" },
                    { 14, 4, (byte)1, true, "How would you rate your relationships with family and friends?" },
                    { 15, 4, (byte)2, true, "How satisfied are you with your work-life balance?" },
                    { 16, 4, (byte)3, true, "Do you have people you can rely on for support?" }
                });

            migrationBuilder.InsertData(
                table: "AssessmentOption",
                columns: new[] { "OptionID", "DisplayOrder", "OptionText", "QuestionID", "Score" },
                values: new object[,]
                {
                    { 1, (byte)1, "None", 1, (byte)4 },
                    { 2, (byte)2, "Mild", 1, (byte)3 },
                    { 3, (byte)3, "Moderate", 1, (byte)2 },
                    { 4, (byte)4, "Severe", 1, (byte)1 },
                    { 5, (byte)1, "Less than 5 hrs", 2, (byte)1 },
                    { 6, (byte)2, "5-6 hrs", 2, (byte)2 },
                    { 7, (byte)3, "7-8 hrs", 2, (byte)4 },
                    { 8, (byte)4, "More than 8 hrs", 2, (byte)3 },
                    { 9, (byte)1, "Very Good", 3, (byte)4 },
                    { 10, (byte)2, "Good", 3, (byte)3 },
                    { 11, (byte)3, "Fair", 3, (byte)2 },
                    { 12, (byte)4, "Poor", 3, (byte)1 },
                    { 13, (byte)1, "Never", 4, (byte)4 },
                    { 14, (byte)2, "Rarely", 4, (byte)3 },
                    { 15, (byte)3, "Sometimes", 4, (byte)2 },
                    { 16, (byte)4, "Often", 4, (byte)1 },
                    { 17, (byte)1, "Never", 5, (byte)4 },
                    { 18, (byte)2, "Rarely", 5, (byte)3 },
                    { 19, (byte)3, "Sometimes", 5, (byte)2 },
                    { 20, (byte)4, "Often", 5, (byte)1 },
                    { 21, (byte)1, "None", 6, (byte)4 },
                    { 22, (byte)2, "Mild", 6, (byte)3 },
                    { 23, (byte)3, "Moderate", 6, (byte)2 },
                    { 24, (byte)4, "Severe", 6, (byte)1 },
                    { 25, (byte)1, "Never", 7, (byte)4 },
                    { 26, (byte)2, "Rarely", 7, (byte)3 },
                    { 27, (byte)3, "Sometimes", 7, (byte)2 },
                    { 28, (byte)4, "Always", 7, (byte)1 },
                    { 29, (byte)1, "Very Good", 8, (byte)4 },
                    { 30, (byte)2, "Good", 8, (byte)3 },
                    { 31, (byte)3, "Fair", 8, (byte)2 },
                    { 32, (byte)4, "Poor", 8, (byte)1 },
                    { 33, (byte)1, "Very Regular", 9, (byte)4 },
                    { 34, (byte)2, "Regular", 9, (byte)3 },
                    { 35, (byte)3, "Irregular", 9, (byte)2 },
                    { 36, (byte)4, "Very Irregular", 9, (byte)1 },
                    { 37, (byte)1, "None", 10, (byte)4 },
                    { 38, (byte)2, "Mild", 10, (byte)3 },
                    { 39, (byte)3, "Moderate", 10, (byte)2 },
                    { 40, (byte)4, "Severe", 10, (byte)1 },
                    { 41, (byte)1, "Strongly Agree", 11, (byte)4 },
                    { 42, (byte)2, "Agree", 11, (byte)3 },
                    { 43, (byte)3, "Disagree", 11, (byte)2 },
                    { 44, (byte)4, "Strongly Disagree", 11, (byte)1 },
                    { 45, (byte)1, "Always", 12, (byte)4 },
                    { 46, (byte)2, "Often", 12, (byte)3 },
                    { 47, (byte)3, "Rarely", 12, (byte)2 },
                    { 48, (byte)4, "Never", 12, (byte)1 },
                    { 49, (byte)1, "Always", 13, (byte)4 },
                    { 50, (byte)2, "Often", 13, (byte)3 },
                    { 51, (byte)3, "Rarely", 13, (byte)2 },
                    { 52, (byte)4, "Never", 13, (byte)1 },
                    { 53, (byte)1, "Excellent", 14, (byte)4 },
                    { 54, (byte)2, "Good", 14, (byte)3 },
                    { 55, (byte)3, "Fair", 14, (byte)2 },
                    { 56, (byte)4, "Poor", 14, (byte)1 },
                    { 57, (byte)1, "Very Satisfied", 15, (byte)4 },
                    { 58, (byte)2, "Satisfied", 15, (byte)3 },
                    { 59, (byte)3, "Unsatisfied", 15, (byte)2 },
                    { 60, (byte)4, "Very Unsatisfied", 15, (byte)1 },
                    { 61, (byte)1, "Always", 16, (byte)4 },
                    { 62, (byte)2, "Most of the time", 16, (byte)3 },
                    { 63, (byte)3, "Rarely", 16, (byte)2 },
                    { 64, (byte)4, "Never", 16, (byte)1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_PatientID_FormDate",
                table: "WellnessForm",
                columns: new[] { "PatientID", "FormDate" });

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_Station1AdminID",
                table: "WellnessForm",
                column: "Station1AdminID");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_Station2AdminID",
                table: "WellnessForm",
                column: "Station2AdminID");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_Status_FormDate",
                table: "WellnessForm",
                columns: new[] { "Status", "FormDate" });

            // ---- data migration, must run before the constraints and unique index below ----

            // Existing forms carry the old two-value status. Map them onto the new
            // station workflow before CK_WellnessForm_Status is applied: a signed
            // form is a finished consultation, anything else never left Station 1.
            migrationBuilder.Sql(@"
                EXEC(N'
                    UPDATE WellnessForm
                    SET Status = ''Completed'',
                        CurrentStation = 3,
                        Station3SubmittedAt = COALESCE(SignedAt, UpdatedAt)
                    WHERE Status = ''Submitted''
                      AND PhysicianID IS NOT NULL
                      AND Signature IS NOT NULL
                      AND SignedAt IS NOT NULL;
                ');");

            // A form marked 'Submitted' without a physician or signature cannot satisfy
            // CK_WellnessForm_CompletedIsSigned, so it goes back to the consultation queue.
            migrationBuilder.Sql(@"
                EXEC(N'
                    UPDATE WellnessForm
                    SET Status = ''PendingConsultation'',
                        CurrentStation = 3
                    WHERE Status = ''Submitted'';
                ');");

            migrationBuilder.Sql(@"
                EXEC(N'
                    UPDATE WellnessForm
                    SET Status = ''PendingAssessment'',
                        CurrentStation = 1
                    WHERE Status = ''Draft'';
                ');");

            // Patient rows now only ever arrive by syncing from the external HR API, so
            // ExternalEmployeeId is unique and non-empty. Rows that predate the column
            // have no HR identity, so they get a deterministic placeholder derived from
            // their key; they must be reconciled against the API before going live.
            migrationBuilder.Sql(@"
                EXEC(N'
                    UPDATE Patient
                    SET ExternalEmployeeId = CONCAT(''LEGACY-'', RIGHT(''0000'' + CAST(PatientID AS varchar(10)), 4))
                    WHERE ExternalEmployeeId IS NULL OR ExternalEmployeeId = '''';
                ');");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR (PhysicianID IS NOT NULL AND Signature IS NOT NULL AND SignedAt IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm",
                sql: "CurrentStation IN (1, 2, 3)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm",
                sql: "Status IN ('PendingAssessment', 'PendingConsultation', 'Completed', 'Cancelled')");

            migrationBuilder.CreateIndex(
                name: "IX_Patient_ExternalEmployeeId",
                table: "Patient",
                column: "ExternalEmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Patient_Surname_FirstName",
                table: "Patient",
                columns: new[] { "Surname", "FirstName" });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentAnswer_FormID_QuestionID",
                table: "AssessmentAnswer",
                columns: new[] { "FormID", "QuestionID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentAnswer_OptionID",
                table: "AssessmentAnswer",
                column: "OptionID");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentAnswer_QuestionID",
                table: "AssessmentAnswer",
                column: "QuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentCategory_Name",
                table: "AssessmentCategory",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentOption_QuestionID",
                table: "AssessmentOption",
                column: "QuestionID");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentQuestion_CategoryID",
                table: "AssessmentQuestion",
                column: "CategoryID");

            migrationBuilder.CreateIndex(
                name: "IX_PatientAccount_PatientID",
                table: "PatientAccount",
                column: "PatientID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PatientSession_PatientAccountID",
                table: "PatientSession",
                column: "PatientAccountID");

            migrationBuilder.CreateIndex(
                name: "IX_PatientSession_TokenHash",
                table: "PatientSession",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhysicianSession_PhysicianID",
                table: "PhysicianSession",
                column: "PhysicianID");

            migrationBuilder.CreateIndex(
                name: "IX_PhysicianSession_TokenHash",
                table: "PhysicianSession",
                column: "TokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WellnessFormAuditLog_FormID",
                table: "WellnessFormAuditLog",
                column: "FormID");

            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Admin_Station1AdminID",
                table: "WellnessForm",
                column: "Station1AdminID",
                principalTable: "Admin",
                principalColumn: "AdminID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Admin_Station2AdminID",
                table: "WellnessForm",
                column: "Station2AdminID",
                principalTable: "Admin",
                principalColumn: "AdminID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Admin_Station1AdminID",
                table: "WellnessForm");

            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Admin_Station2AdminID",
                table: "WellnessForm");

            migrationBuilder.DropTable(
                name: "AssessmentAnswer");

            migrationBuilder.DropTable(
                name: "PatientSession");

            migrationBuilder.DropTable(
                name: "PhysicianSession");

            migrationBuilder.DropTable(
                name: "WellnessFormAuditLog");

            migrationBuilder.DropTable(
                name: "AssessmentOption");

            migrationBuilder.DropTable(
                name: "PatientAccount");

            migrationBuilder.DropTable(
                name: "AssessmentQuestion");

            migrationBuilder.DropTable(
                name: "AssessmentCategory");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_PatientID_FormDate",
                table: "WellnessForm");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_Station1AdminID",
                table: "WellnessForm");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_Station2AdminID",
                table: "WellnessForm");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_Status_FormDate",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsSigned",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm");

            migrationBuilder.DropIndex(
                name: "IX_Patient_ExternalEmployeeId",
                table: "Patient");

            migrationBuilder.DropIndex(
                name: "IX_Patient_Surname_FirstName",
                table: "Patient");

            migrationBuilder.DropColumn(
                name: "CurrentStation",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station1AdminID",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station1SubmittedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station2AdminID",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station2SubmittedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station3SubmittedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "ExternalEmployeeId",
                table: "Patient");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Patient");

            migrationBuilder.DropColumn(
                name: "FamilyMembers",
                table: "FamilyMedicalHistory");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "WellnessForm",
                type: "varchar(20)",
                unicode: false,
                maxLength: 20,
                nullable: false,
                defaultValue: "Draft",
                oldClrType: typeof(string),
                oldType: "varchar(20)",
                oldUnicode: false,
                oldMaxLength: 20,
                oldDefaultValue: "PendingAssessment");

            migrationBuilder.AlterColumn<string>(
                name: "RecommendedDiagnosticTest",
                table: "WellnessForm",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ManagementTreatment",
                table: "WellnessForm",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ImpressionClinical",
                table: "WellnessForm",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_PatientID",
                table: "WellnessForm",
                column: "PatientID");
        }
    }
}

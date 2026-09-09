using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDentalStation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm");

            migrationBuilder.AddColumn<string>(
                name: "DentalSignature",
                table: "WellnessForm",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DentalSignedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DentistID",
                table: "WellnessForm",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station4SubmittedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DentalAssessment",
                columns: table => new
                {
                    DentalAssessmentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    OralHygieneStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OralHygieneStatusRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DentalCaries = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DentalCariesRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    GumCondition = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    GumConditionRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ToothStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ToothStatusRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ToothachePain = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ToothachePainRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    OralLesions = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    OralLesionsRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DentureUse = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DentureUseRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DentalTreatmentNeed = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DentalTreatmentNeedRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    LastDentalVisit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LastDentalVisitRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DentalReferral = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DentalReferralRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DentalAssessment", x => x.DentalAssessmentID);
                    table.CheckConstraint("CK_DentalAssessment_DentalCaries", "DentalCaries IS NULL OR DentalCaries IN ('None', 'Present')");
                    table.CheckConstraint("CK_DentalAssessment_DentalReferral", "DentalReferral IS NULL OR DentalReferral IN ('Not needed', 'Routine referral', 'Urgent referral')");
                    table.CheckConstraint("CK_DentalAssessment_DentalTreatmentNeed", "DentalTreatmentNeed IS NULL OR DentalTreatmentNeed IN ('None', 'Preventive Care', 'Restorative Treatment', 'Extraction', 'Other')");
                    table.CheckConstraint("CK_DentalAssessment_DentureUse", "DentureUse IS NULL OR DentureUse IN ('None', 'Yes – satisfactory', 'Yes – needs assessment')");
                    table.CheckConstraint("CK_DentalAssessment_GumCondition", "GumCondition IS NULL OR GumCondition IN ('Healthy', 'Gingivitis', 'Suspected Periodontal Problem')");
                    table.CheckConstraint("CK_DentalAssessment_LastDentalVisit", "LastDentalVisit IS NULL OR LastDentalVisit IN ('Within 6 months', '6–12 months', 'More than 1 year', 'Never')");
                    table.CheckConstraint("CK_DentalAssessment_OralHygieneStatus", "OralHygieneStatus IS NULL OR OralHygieneStatus IN ('Good', 'Fair', 'Poor')");
                    table.CheckConstraint("CK_DentalAssessment_OralLesions", "OralLesions IS NULL OR OralLesions IN ('None', 'Present – refer for evaluation')");
                    table.CheckConstraint("CK_DentalAssessment_ToothachePain", "ToothachePain IS NULL OR ToothachePain IN ('No', 'Yes')");
                    table.CheckConstraint("CK_DentalAssessment_ToothStatus", "ToothStatus IS NULL OR ToothStatus IN ('Complete/Functional', 'Missing Teeth', 'Needs Dental Treatment')");
                    table.ForeignKey(
                        name: "FK_DentalAssessment_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_DentistID",
                table: "WellnessForm",
                column: "DentistID");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsDentalSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR (DentistID IS NOT NULL AND DentalSignature IS NOT NULL AND DentalSignedAt IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm",
                sql: "CurrentStation IN (1, 2, 3, 4)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm",
                sql: "Status IN ('PendingAssessment', 'PendingConsultation', 'PendingDental', 'Completed', 'Cancelled')");

            migrationBuilder.CreateIndex(
                name: "IX_DentalAssessment_FormID",
                table: "DentalAssessment",
                column: "FormID",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Physician_DentistID",
                table: "WellnessForm",
                column: "DentistID",
                principalTable: "Physician",
                principalColumn: "PhysicianID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Physician_DentistID",
                table: "WellnessForm");

            migrationBuilder.DropTable(
                name: "DentalAssessment");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_DentistID",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsDentalSigned",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "DentalSignature",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "DentalSignedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "DentistID",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station4SubmittedAt",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm",
                sql: "CurrentStation IN (1, 2, 3)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm",
                sql: "Status IN ('PendingAssessment', 'PendingConsultation', 'Completed', 'Cancelled')");
        }
    }
}

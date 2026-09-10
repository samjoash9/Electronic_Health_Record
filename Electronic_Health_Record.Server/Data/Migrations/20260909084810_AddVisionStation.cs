using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVisionStation : Migration
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

            migrationBuilder.AddColumn<int>(
                name: "OptometristID",
                table: "WellnessForm",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Station5SubmittedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisionSignature",
                table: "WellnessForm",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VisionSignedAt",
                table: "WellnessForm",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VisionAssessment",
                columns: table => new
                {
                    VisionAssessmentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    HistoryOfEyeProblems = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    HistoryOfEyeProblemsRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    EyePainDiscomfort = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EyePainDiscomfortRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    BlurredVision = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BlurredVisionRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DifficultySeeingNear = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DifficultySeeingNearRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    DifficultySeeingDistant = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DifficultySeeingDistantRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    HeadacheEyeStrain = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    HeadacheEyeStrainRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    UsesEyeglassesContactLenses = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UsesEyeglassesContactLensesRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    VisualAcuityRightEye = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    VisualAcuityRightEyeRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    VisualAcuityLeftEye = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    VisualAcuityLeftEyeRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    EyeConditionIdentified = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EyeConditionOther = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    EyeConditionIdentifiedRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CorrectiveLensesRecommended = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CorrectiveLensesRecommendedRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    ReferralToEyeSpecialist = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ReferralToEyeSpecialistRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    FollowUpConsultationAdvised = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    FollowUpConsultationAdvisedRemarks = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisionAssessment", x => x.VisionAssessmentID);
                    table.CheckConstraint("CK_VisionAssessment_BlurredVision", "BlurredVision IS NULL OR BlurredVision IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_CorrectiveLensesRecommended", "CorrectiveLensesRecommended IS NULL OR CorrectiveLensesRecommended IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_DifficultySeeingDistant", "DifficultySeeingDistant IS NULL OR DifficultySeeingDistant IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_DifficultySeeingNear", "DifficultySeeingNear IS NULL OR DifficultySeeingNear IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_EyeConditionIdentified", "EyeConditionIdentified IS NULL OR EyeConditionIdentified IN ('None', 'Refractive error', 'Other')");
                    table.CheckConstraint("CK_VisionAssessment_EyePainDiscomfort", "EyePainDiscomfort IS NULL OR EyePainDiscomfort IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_FollowUpConsultationAdvised", "FollowUpConsultationAdvised IS NULL OR FollowUpConsultationAdvised IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_HeadacheEyeStrain", "HeadacheEyeStrain IS NULL OR HeadacheEyeStrain IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_HistoryOfEyeProblems", "HistoryOfEyeProblems IS NULL OR HistoryOfEyeProblems IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_ReferralToEyeSpecialist", "ReferralToEyeSpecialist IS NULL OR ReferralToEyeSpecialist IN ('No', 'Yes')");
                    table.CheckConstraint("CK_VisionAssessment_UsesEyeglassesContactLenses", "UsesEyeglassesContactLenses IS NULL OR UsesEyeglassesContactLenses IN ('No', 'Yes')");
                    table.ForeignKey(
                        name: "FK_VisionAssessment_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WellnessForm_OptometristID",
                table: "WellnessForm",
                column: "OptometristID");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CompletedIsVisionSigned",
                table: "WellnessForm",
                sql: "Status <> 'Completed' OR CurrentStation < 5 OR (OptometristID IS NOT NULL AND VisionSignature IS NOT NULL AND VisionSignedAt IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm",
                sql: "CurrentStation IN (1, 2, 3, 4, 5)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm",
                sql: "Status IN ('PendingAssessment', 'PendingConsultation', 'PendingDental', 'PendingVision', 'Completed', 'Cancelled')");

            migrationBuilder.CreateIndex(
                name: "IX_VisionAssessment_FormID",
                table: "VisionAssessment",
                column: "FormID",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WellnessForm_Physician_OptometristID",
                table: "WellnessForm",
                column: "OptometristID",
                principalTable: "Physician",
                principalColumn: "PhysicianID",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WellnessForm_Physician_OptometristID",
                table: "WellnessForm");

            migrationBuilder.DropTable(
                name: "VisionAssessment");

            migrationBuilder.DropIndex(
                name: "IX_WellnessForm_OptometristID",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CompletedIsVisionSigned",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "OptometristID",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "Station5SubmittedAt",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "VisionSignature",
                table: "WellnessForm");

            migrationBuilder.DropColumn(
                name: "VisionSignedAt",
                table: "WellnessForm");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_CurrentStation",
                table: "WellnessForm",
                sql: "CurrentStation IN (1, 2, 3, 4)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WellnessForm_Status",
                table: "WellnessForm",
                sql: "Status IN ('PendingAssessment', 'PendingConsultation', 'PendingDental', 'Completed', 'Cancelled')");
        }
    }
}

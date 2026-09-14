using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class ReplacePerVisitBillingWithBillingPeriods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillingSettings");

            migrationBuilder.DropTable(
                name: "FormBilling");

            migrationBuilder.CreateTable(
                name: "BillingForm",
                columns: table => new
                {
                    BillingFormID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StartDate = table.Column<DateTime>(type: "date", nullable: false),
                    EndDate = table.Column<DateTime>(type: "date", nullable: false),
                    Capital = table.Column<decimal>(type: "decimal(14,2)", precision: 14, scale: 2, nullable: false),
                    CreatedByAdminID = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingForm", x => x.BillingFormID);
                    table.CheckConstraint("CK_BillingForm_Capital", "Capital >= 0");
                    table.CheckConstraint("CK_BillingForm_DateOrder", "EndDate >= StartDate");
                    table.ForeignKey(
                        name: "FK_BillingForm_Admin_CreatedByAdminID",
                        column: x => x.CreatedByAdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillingForm_CreatedByAdminID",
                table: "BillingForm",
                column: "CreatedByAdminID");

            migrationBuilder.CreateIndex(
                name: "IX_BillingForm_StartDate",
                table: "BillingForm",
                column: "StartDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillingForm");

            migrationBuilder.CreateTable(
                name: "BillingSettings",
                columns: table => new
                {
                    BillingSettingsID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefaultAllotment = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedByAdminID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BillingSettings", x => x.BillingSettingsID);
                    table.CheckConstraint("CK_BillingSettings_SingletonId", "BillingSettingsID = 1");
                    table.ForeignKey(
                        name: "FK_BillingSettings_Admin_UpdatedByAdminID",
                        column: x => x.UpdatedByAdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FormBilling",
                columns: table => new
                {
                    FormBillingID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AllotmentSnapshot = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ApprovedByAdminID = table.Column<int>(type: "int", nullable: true),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    OverrideReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true),
                    Status = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "Pending"),
                    TotalCharged = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FormBilling", x => x.FormBillingID);
                    table.CheckConstraint("CK_FormBilling_DeductedIsApproved", "Status <> 'Deducted' OR (TotalCharged IS NOT NULL AND ApprovedByAdminID IS NOT NULL AND ApprovedAt IS NOT NULL)");
                    table.CheckConstraint("CK_FormBilling_Status", "Status IN ('Pending', 'Deducted')");
                    table.ForeignKey(
                        name: "FK_FormBilling_Admin_ApprovedByAdminID",
                        column: x => x.ApprovedByAdminID,
                        principalTable: "Admin",
                        principalColumn: "AdminID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_FormBilling_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "BillingSettings",
                columns: new[] { "BillingSettingsID", "DefaultAllotment", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[] { 1, 0m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null });

            migrationBuilder.CreateIndex(
                name: "IX_BillingSettings_UpdatedByAdminID",
                table: "BillingSettings",
                column: "UpdatedByAdminID");

            migrationBuilder.CreateIndex(
                name: "IX_FormBilling_ApprovedByAdminID",
                table: "FormBilling",
                column: "ApprovedByAdminID");

            migrationBuilder.CreateIndex(
                name: "IX_FormBilling_FormID",
                table: "FormBilling",
                column: "FormID",
                unique: true);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Electronic_Health_Record.Server.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBillingAndChargeCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BillingSettings",
                columns: table => new
                {
                    BillingSettingsID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DefaultAllotment = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    UpdatedByAdminID = table.Column<int>(type: "int", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
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
                name: "ChargeItem",
                columns: table => new
                {
                    ChargeItemID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ItemType = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    UnitPrice = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()"),
                    UpdatedByAdminID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChargeItem", x => x.ChargeItemID);
                    table.CheckConstraint("CK_ChargeItem_ItemType", "ItemType IN ('Lab', 'Medication')");
                    table.ForeignKey(
                        name: "FK_ChargeItem_Admin_UpdatedByAdminID",
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
                    FormID = table.Column<int>(type: "int", nullable: false),
                    AllotmentSnapshot = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false, defaultValue: "Pending"),
                    TotalCharged = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: true),
                    ApprovedByAdminID = table.Column<int>(type: "int", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    OverrideReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
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

            migrationBuilder.CreateTable(
                name: "WellnessFormCharge",
                columns: table => new
                {
                    ChargeID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FormID = table.Column<int>(type: "int", nullable: false),
                    ChargeItemID = table.Column<int>(type: "int", nullable: true),
                    ItemType = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: true),
                    Quantity = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Dosage = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Frequency = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WellnessFormCharge", x => x.ChargeID);
                    table.CheckConstraint("CK_WellnessFormCharge_ItemType", "ItemType IN ('Lab', 'Medication')");
                    table.CheckConstraint("CK_WellnessFormCharge_Quantity", "Quantity > 0");
                    table.ForeignKey(
                        name: "FK_WellnessFormCharge_ChargeItem_ChargeItemID",
                        column: x => x.ChargeItemID,
                        principalTable: "ChargeItem",
                        principalColumn: "ChargeItemID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WellnessFormCharge_WellnessForm_FormID",
                        column: x => x.FormID,
                        principalTable: "WellnessForm",
                        principalColumn: "FormID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "BillingSettings",
                columns: new[] { "BillingSettingsID", "DefaultAllotment", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[] { 1, 0m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null });

            migrationBuilder.InsertData(
                table: "ChargeItem",
                columns: new[] { "ChargeItemID", "Category", "CreatedAt", "DisplayOrder", "IsActive", "ItemType", "Name", "UnitPrice", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[,]
                {
                    { 1, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 1, true, "Lab", "CBC", 180m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 2, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 2, true, "Lab", "BT", 100m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 3, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 3, true, "Lab", "U/A", 130m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 4, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 4, true, "Lab", "SE", 50m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 5, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 5, true, "Lab", "RBS", 120m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 6, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 6, true, "Lab", "FBS", 120m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 7, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 7, true, "Lab", "Lipid Profile", 900m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.InsertData(
                table: "ChargeItem",
                columns: new[] { "ChargeItemID", "Category", "CreatedAt", "DisplayOrder", "ItemType", "Name", "UnitPrice", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[] { 8, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 7, "Lab", "Liquid Profile", 900m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null });

            migrationBuilder.InsertData(
                table: "ChargeItem",
                columns: new[] { "ChargeItemID", "Category", "CreatedAt", "DisplayOrder", "IsActive", "ItemType", "Name", "UnitPrice", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[,]
                {
                    { 9, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 8, true, "Lab", "Crea", 230m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 10, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 9, true, "Lab", "SGPT/SGOT", 500m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 11, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 10, true, "Lab", "SUA", 200m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 12, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 11, true, "Lab", "ASO", 180m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 13, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 12, true, "Lab", "NaK", 800m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 14, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 13, true, "Lab", "BUN", 300m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 15, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 14, true, "Lab", "HCV", null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.InsertData(
                table: "ChargeItem",
                columns: new[] { "ChargeItemID", "Category", "CreatedAt", "DisplayOrder", "ItemType", "Name", "UnitPrice", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[] { 16, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 14, "Lab", "HVC", null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null });

            migrationBuilder.InsertData(
                table: "ChargeItem",
                columns: new[] { "ChargeItemID", "Category", "CreatedAt", "DisplayOrder", "IsActive", "ItemType", "Name", "UnitPrice", "UpdatedAt", "UpdatedByAdminID" },
                values: new object[,]
                {
                    { 17, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 15, true, "Lab", "Tumor Markers CA 125", null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 18, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 16, true, "Lab", "TT3", 650m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 19, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 17, true, "Lab", "TT4", 650m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 20, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 18, true, "Lab", "TSH", null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 21, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 19, true, "Lab", "Drug Test", 250m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 22, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 20, true, "Lab", "H. Pylori", 450m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 23, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 21, true, "Lab", "HBA1c", 900m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 24, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 22, true, "Lab", "ECG", null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 25, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 23, true, "Lab", "UTZ", null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 26, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 24, true, "Lab", "Chest Xray", 220m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null },
                    { 27, null, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), 25, true, "Lab", "Papsmear", 400m, new DateTime(2026, 9, 13, 0, 0, 0, 0, DateTimeKind.Utc), null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BillingSettings_UpdatedByAdminID",
                table: "BillingSettings",
                column: "UpdatedByAdminID");

            migrationBuilder.CreateIndex(
                name: "IX_ChargeItem_ItemType_IsActive_DisplayOrder",
                table: "ChargeItem",
                columns: new[] { "ItemType", "IsActive", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ChargeItem_ItemType_Name",
                table: "ChargeItem",
                columns: new[] { "ItemType", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChargeItem_UpdatedByAdminID",
                table: "ChargeItem",
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

            migrationBuilder.CreateIndex(
                name: "IX_WellnessFormCharge_ChargeItemID",
                table: "WellnessFormCharge",
                column: "ChargeItemID");

            migrationBuilder.CreateIndex(
                name: "IX_WellnessFormCharge_FormID",
                table: "WellnessFormCharge",
                column: "FormID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BillingSettings");

            migrationBuilder.DropTable(
                name: "FormBilling");

            migrationBuilder.DropTable(
                name: "WellnessFormCharge");

            migrationBuilder.DropTable(
                name: "ChargeItem");
        }
    }
}

namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// One billable line on one visit -- a lab test or a medication Station 3
    /// recorded against a WellnessForm. This is billing's source of truth; the
    /// free-text RecommendedDiagnosticTest and ManagementTreatment columns on
    /// WellnessForm remain the physician-facing display text and are no longer
    /// parsed for money.
    /// </summary>
    public class WellnessFormCharge
    {
        public int ChargeID { get; set; }
        public int FormID { get; set; }
        // Null for a free-text item the physician typed that matches nothing in
        // the catalog. ON DELETE SET NULL: retiring a catalog item must never
        // delete a historical charge.
        public int? ChargeItemID { get; set; }
        // "Lab" | "Medication". Copied from the catalog item (or chosen directly
        // for a free-text row) so a charge is self-describing without a join.
        public string ItemType { get; set; } = string.Empty;
        // Snapshot of the catalog item's name at the time this charge was
        // created, so a later catalog rename does not change what a past bill
        // reads as having charged for.
        public string Name { get; set; } = string.Empty;
        // Snapshot of the price at creation (see ChargeItem.UnitPrice for what
        // null means). Editing the catalog afterward never re-prices this row.
        public decimal? UnitPrice { get; set; }
        public int Quantity { get; set; } = 1;
        // Medication rows only.
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

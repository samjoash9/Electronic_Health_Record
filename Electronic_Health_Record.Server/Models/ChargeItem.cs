namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// The admin-owned billing catalog: every laboratory test and medication that
    /// can appear as a line item on a wellness form, with its price. Replaces the
    /// hardcoded DIAGNOSTIC_TEST_CATALOG client array -- the catalog is now server
    /// data an admin can edit without a redeploy.
    /// </summary>
    public class ChargeItem
    {
        public int ChargeItemID { get; set; }
        // "Lab" | "Medication" -- see ChargeItemType. Enforced by CK_ChargeItem_ItemType.
        public string ItemType { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        // Medication category ("Antibiotic", "Maintenance", ...) for the billing
        // UI's colored pills. Null for labs, which have no such grouping.
        public string? Category { get; set; }
        // Null means the office has no fixed rate for this item; the physician
        // quotes it per patient at Station 3 instead. Never treated as zero.
        public decimal? UnitPrice { get; set; }
        // Retiring an item never deletes the row: WellnessFormCharge rows may
        // still reference it, and a charge's own Name/UnitPrice snapshot must
        // keep resolving even after the catalog entry is retired.
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int? UpdatedByAdminID { get; set; }
    }

    /// <summary>The values legal in ChargeItem.ItemType and WellnessFormCharge.ItemType.</summary>
    public static class ChargeItemType
    {
        public const string Lab = "Lab";
        public const string Medication = "Medication";

        public static readonly string[] All = [Lab, Medication];

        public static bool IsValid(string? type) => All.Contains(type);
    }
}

namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// Single-row global billing configuration: the default allotment every
    /// patient's visit gets. Enforced as exactly one row by CK_BillingSettings_SingletonId
    /// (BillingSettingsID must equal 1) so a read never has to handle "not configured yet".
    /// </summary>
    public class BillingSettings
    {
        public int BillingSettingsID { get; set; } = 1;
        public decimal DefaultAllotment { get; set; }
        public int? UpdatedByAdminID { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

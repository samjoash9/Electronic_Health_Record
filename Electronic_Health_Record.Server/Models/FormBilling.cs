namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// One visit's billing outcome. Created (or updated, on a re-approve after a
    /// prior approve failed) when an admin approves a form's charges at Station 6.
    ///
    /// There is deliberately no running-balance column here or anywhere else in
    /// the billing schema: because the allotment is scoped to one form rather
    /// than a calendar period, "remaining" is always AllotmentSnapshot minus
    /// TotalCharged, derived from this form's own WellnessFormCharge rows on
    /// every read. A stored balance would be a second number that could disagree
    /// with the rows it is supposed to summarise.
    /// </summary>
    public class FormBilling
    {
        public int FormBillingID { get; set; }
        public int FormID { get; set; }
        // BillingSettings.DefaultAllotment as of the moment this form was
        // approved -- a later change to the global default never re-prices a
        // form that already went through.
        public decimal AllotmentSnapshot { get; set; }
        // "Pending" | "Deducted". See FormBillingStatus.
        public string Status { get; set; } = FormBillingStatus.Pending;
        // Server-recomputed total of the form's WellnessFormCharge rows at
        // approval time; never trusts a client-sent total. Null until approved.
        public decimal? TotalCharged { get; set; }
        public int? ApprovedByAdminID { get; set; }
        public DateTime? ApprovedAt { get; set; }
        // Set only when TotalCharged exceeded AllotmentSnapshot and the admin
        // chose to proceed anyway. Its presence is what distinguishes a normal
        // approval from an overridden one.
        public string? OverrideReason { get; set; }
        public byte[]? RowVersion { get; set; }
    }

    public static class FormBillingStatus
    {
        public const string Pending = "Pending";
        public const string Deducted = "Deducted";

        public static readonly string[] All = [Pending, Deducted];
    }
}

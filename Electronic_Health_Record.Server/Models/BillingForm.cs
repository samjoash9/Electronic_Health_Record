namespace Electronic_Health_Record.Server.Models
{
    /// <summary>
    /// A budget period: one capital allocation covering every visit whose
    /// FormDate falls between StartDate and EndDate inclusive.
    ///
    /// This replaces the earlier per-visit allotment model. Money is now pooled
    /// per period rather than issued per patient, so a visit does not carry its
    /// own budget -- it draws down the form whose range contains its date.
    ///
    /// Deliberately no Consumed or Remaining column. Both are summed from the
    /// period's WellnessFormCharge rows on every read, so a charge recorded at
    /// Station 3 after this form was created is counted without anyone
    /// re-approving anything. A stored balance would be a second number that
    /// could disagree with the rows it summarises.
    ///
    /// Ranges may not overlap (enforced in BillingFormsController, which no
    /// single-row check constraint can express). That is what makes "the
    /// corresponding billing form" for a visit unambiguous: at most one period
    /// contains any given date.
    /// </summary>
    public class BillingForm
    {
        public int BillingFormID { get; set; }
        public string Title { get; set; } = string.Empty;
        // Date-only in practice; the time component is never displayed. Both
        // bounds are inclusive -- a visit on EndDate belongs to this period.
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        // The pool every visit in the window is deducted from. Not snapshotted
        // anywhere: editing it re-prices the period, which is the intent.
        public decimal Capital { get; set; }
        public int? CreatedByAdminID { get; set; }
        public DateTime CreatedAt { get; set; }
        public byte[]? RowVersion { get; set; }
    }
}

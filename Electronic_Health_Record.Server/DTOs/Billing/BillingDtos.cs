using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Billing
{
    public class BillingSettingsResponseDto
    {
        public decimal DefaultAllotment { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateBillingSettingsDto
    {
        [Required]
        [Range(0, 99999999.99)]
        public decimal DefaultAllotment { get; set; }
    }

    // One row in the Station 6 queue table. AgencyOffice rides along because
    // the office is displayed prominently in the existing invoice UI.
    public class BillingQueueRowDto
    {
        public int FormID { get; set; }
        public int PatientID { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string? AgencyOffice { get; set; }
        public DateTime FormDate { get; set; }
        public int ItemCount { get; set; }
        public decimal TotalCharged { get; set; }
        public decimal Allotment { get; set; }
        public decimal Remaining { get; set; }
        // "Pending" | "Deducted". A form with no FormBilling row yet reads as
        // Pending against the current DefaultAllotment -- billing state is only
        // created on approval, not the moment a form reaches the queue.
        public string Status { get; set; } = string.Empty;
        public bool IsOverBudget { get; set; }
    }

    public class ChargeLineDto
    {
        public int ChargeID { get; set; }
        public string ItemType { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal? UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        // Null, not zero, when UnitPrice is null -- an unpriced line must never
        // silently count as free.
        public decimal? LineTotal { get; set; }
    }

    public class BillingInvoiceDto
    {
        public int FormID { get; set; }
        public int PatientID { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string? AgencyOffice { get; set; }
        public DateTime FormDate { get; set; }
        public List<ChargeLineDto> Charges { get; set; } = new();
        public decimal TotalCharged { get; set; }
        public int UnpricedCount { get; set; }
        public decimal Allotment { get; set; }
        public decimal Remaining { get; set; }
        public bool IsOverBudget { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? OverrideReason { get; set; }
        public string? ApprovedByAdminName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string RowVersion { get; set; } = string.Empty;
    }

    public class ApproveBillingDto
    {
        [Required]
        public string RowVersion { get; set; } = string.Empty;

        // Present only on the resubmit after the client has shown the admin
        // the overage and they chose to proceed anyway. Its absence is what
        // makes the first attempt at an over-budget bill fail with 409 --
        // decision 3's warning is enforced here, not just in the dialog.
        [MaxLength(200)]
        public string? OverrideReason { get; set; }
    }

    // Returned on 409 when TotalCharged exceeds the allotment and no
    // OverrideReason was sent, so the client can show the exact excess in its
    // confirm dialog rather than a generic error.
    public class BillingOverageDto
    {
        public string Message { get; set; } = "This bill exceeds the patient's allotment.";
        public decimal TotalCharged { get; set; }
        public decimal Allotment { get; set; }
        public decimal Overage { get; set; }
    }
}

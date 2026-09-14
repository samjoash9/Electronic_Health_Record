using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Billing
{
    // One row in the Station 6 table: a budget period with its consumption
    // already computed server-side from the charges dated inside it.
    public class BillingFormRowDto
    {
        public int BillingFormID { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Capital { get; set; }
        public decimal Consumed { get; set; }
        public decimal Remaining { get; set; }
        // Distinct patients with at least one charge in the window -- the
        // "employees covered" figure, not a count of visits.
        public int EmployeeCount { get; set; }
        public int FormCount { get; set; }
        // Charges whose UnitPrice is null. They contribute 0 to Consumed, so
        // the count is surfaced rather than letting them vanish silently.
        public int UnpricedCount { get; set; }
        public bool IsOverBudget { get; set; }
        public DateTime CreatedAt { get; set; }
        public string RowVersion { get; set; } = string.Empty;
    }

    // One employee's consumption within a period: the detail view's row.
    public class BillingFormPatientDto
    {
        public int PatientID { get; set; }
        public string PatientName { get; set; } = string.Empty;
        public string? AgencyOffice { get; set; }
        public int FormCount { get; set; }
        public int ItemCount { get; set; }
        public decimal Subtotal { get; set; }
        public int UnpricedCount { get; set; }
        public List<BillingFormVisitDto> Visits { get; set; } = new();
    }

    public class BillingFormVisitDto
    {
        public int FormID { get; set; }
        public DateTime FormDate { get; set; }
        public decimal Subtotal { get; set; }
        public List<ChargeLineDto> Charges { get; set; } = new();
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

    // GET /api/billing/forms/{id}: the period plus everyone it covers.
    public class BillingFormDetailDto
    {
        public int BillingFormID { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal Capital { get; set; }
        public decimal Consumed { get; set; }
        public decimal Remaining { get; set; }
        public bool IsOverBudget { get; set; }
        public int UnpricedCount { get; set; }
        public string? CreatedByAdminName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string RowVersion { get; set; } = string.Empty;
        public List<BillingFormPatientDto> Patients { get; set; } = new();
    }

    public class CreateBillingFormDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Range(0, 999999999.99)]
        public decimal Capital { get; set; }
    }

    public class UpdateBillingFormDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Range(0, 999999999.99)]
        public decimal Capital { get; set; }

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }

    // Returned on 409 when a create or edit would make two periods cover the
    // same date, so the client can name the period already holding it rather
    // than showing a generic error.
    public class BillingPeriodOverlapDto
    {
        public string Message { get; set; } = "This period overlaps an existing billing form.";
        public int ConflictingBillingFormID { get; set; }
        public string ConflictingTitle { get; set; } = string.Empty;
        public DateTime ConflictingStartDate { get; set; }
        public DateTime ConflictingEndDate { get; set; }
    }
}

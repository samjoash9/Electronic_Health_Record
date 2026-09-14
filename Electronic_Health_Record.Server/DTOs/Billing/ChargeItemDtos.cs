using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Billing
{
    // Response shape for a catalog entry. Read is open to any authenticated
    // station (Station 3 needs this to populate its picker); only the write
    // endpoints below are admin-only.
    public class ChargeItemResponseDto
    {
        public int ChargeItemID { get; set; }
        public string ItemType { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; }
        public decimal? UnitPrice { get; set; }
        public bool IsActive { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateChargeItemDto
    {
        [Required(ErrorMessage = "ItemType must be Lab or Medication.")]
        public string ItemType { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Category { get; set; }

        // Null is legal and means "quote per patient" -- not every lab has a
        // fixed office rate.
        [Range(0, 999999.99)]
        public decimal? UnitPrice { get; set; }

        public int DisplayOrder { get; set; }
    }

    // Every field is sent on an edit (no partial-patch semantics), matching
    // the UpdateWellnessFormDto pattern elsewhere in this API.
    public class UpdateChargeItemDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Category { get; set; }

        [Range(0, 999999.99)]
        public decimal? UnitPrice { get; set; }

        public bool IsActive { get; set; }

        public int DisplayOrder { get; set; }
    }
}

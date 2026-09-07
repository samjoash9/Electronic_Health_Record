using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    // The client spreads consultation fields flat onto the POST body alongside
    // rowVersion (see submitStation3 in src/api/forms.api.js) rather than nesting
    // them under a "consultation" key.
    public class Station3SubmitDto
    {
        [MaxLength(150)]
        public string? RecommendedDiagnosticTest { get; set; }

        [MaxLength(300)]
        public string? ImpressionClinical { get; set; }

        [MaxLength(300)]
        public string? ManagementTreatment { get; set; }

        // required by the server even though the client's own submit button is
        // already disabled without one — the disabled button is not a security
        // boundary
        [Required(ErrorMessage = "A physician signature is required before submitting.")]
        public string Signature { get; set; } = string.Empty;

        public List<PastMedicalHistoryItemDto> PastMedicalHistory { get; set; } = new();

        public List<FamilyMedicalHistoryItemDto> FamilyMedicalHistory { get; set; } = new();

        public SocialHistoryDto? SocialHistory { get; set; }

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }
}

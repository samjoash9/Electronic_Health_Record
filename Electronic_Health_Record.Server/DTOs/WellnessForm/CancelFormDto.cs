using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class CancelFormDto
    {
        /// <summary>
        /// Why the form was cancelled. Required: a cancellation is the one action
        /// that removes a form from every station queue, so the audit trail is
        /// worth nothing without the operator's reason.
        /// </summary>
        [Required]
        [StringLength(500, MinimumLength = 3)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }
}

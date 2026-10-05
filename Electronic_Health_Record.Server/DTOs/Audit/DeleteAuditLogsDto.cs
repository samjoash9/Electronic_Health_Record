using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.Audit
{
    public class DeleteAuditLogsDto
    {
        /// <summary>
        /// The LogIDs to remove. Capped so one request cannot lock the table
        /// for long; the client sends at most a page's worth of selected rows.
        /// </summary>
        [Required]
        [MinLength(1)]
        [MaxLength(500)]
        public List<long> LogIDs { get; set; } = new();
    }
}

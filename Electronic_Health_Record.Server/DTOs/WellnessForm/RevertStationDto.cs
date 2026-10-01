using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class RevertStationDto
    {
        /// <summary>
        /// The station to send the form back to. Must be lower than the form's
        /// current station -- see RevertStation in WellnessFormsController for
        /// why this only ever moves backwards.
        /// </summary>
        [Required]
        [Range(1, 5)]
        public byte TargetStation { get; set; }

        /// <summary>
        /// Why the form was sent back. Required for the same reason as
        /// CancelFormDto.Reason: a revert pulls a form out of one station's
        /// queue and drops it into an earlier one, and the audit row is the
        /// only place that explains why the station it was at lost the record.
        /// </summary>
        [Required]
        [StringLength(500, MinimumLength = 3)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }
}

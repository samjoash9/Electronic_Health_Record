using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class DeleteFormDto
    {
        /// <summary>
        /// Why the form was deleted. Required: a hard delete removes the form and
        /// every row that points at it, including its own audit trail, so this
        /// reason is the only record of the deletion left anywhere -- it belongs
        /// wherever the caller logs superadmin actions.
        /// </summary>
        [Required]
        [StringLength(500, MinimumLength = 3)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }
}

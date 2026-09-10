using System.ComponentModel.DataAnnotations;

namespace Electronic_Health_Record.Server.DTOs.WellnessForm
{
    public class Station2SubmitDto
    {
        public List<Station2AnswerDto> Answers { get; set; } = new();

        // opaque rowversion token, base64. Required: a missing value here would
        // silently skip the client's own staleness check (see assertFresh in
        // src/api/forms.api.js), so the server must not treat it as optional too.
        [Required]
        public string RowVersion { get; set; } = string.Empty;
    }

    public class Station2AnswerDto
    {
        [Required]
        public int QuestionID { get; set; }

        [Required]
        public int OptionID { get; set; }
    }
}

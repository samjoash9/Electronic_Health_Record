namespace Electronic_Health_Record.Server.Models
{
    public class AssessmentAnswer
    {
        public int AnswerID { get; set; }
        public int FormID { get; set; }
        public int QuestionID { get; set; }
        public int OptionID { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

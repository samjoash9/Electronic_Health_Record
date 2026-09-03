namespace Electronic_Health_Record.Server.Models
{
    public class AssessmentOption
    {
        public int OptionID { get; set; }
        public int QuestionID { get; set; }
        public string OptionText { get; set; } = string.Empty;
        // 4 = best/healthiest, 1 = worst, consistently across every question,
        // so a category score is SUM(Score) and higher always means better
        public byte Score { get; set; }
        public byte DisplayOrder { get; set; }
    }
}

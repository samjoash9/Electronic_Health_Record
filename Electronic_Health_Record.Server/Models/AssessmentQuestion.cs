namespace Electronic_Health_Record.Server.Models
{
    public class AssessmentQuestion
    {
        public int QuestionID { get; set; }
        public int CategoryID { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public byte DisplayOrder { get; set; }
        // retired questions stay in the table so historical answers still resolve
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
    }
}

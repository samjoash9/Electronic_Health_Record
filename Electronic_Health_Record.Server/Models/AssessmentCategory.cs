namespace Electronic_Health_Record.Server.Models
{
    public class AssessmentCategory
    {
        public int CategoryID { get; set; }
        public string Name { get; set; } = string.Empty;
        public byte DisplayOrder { get; set; }
    }
}

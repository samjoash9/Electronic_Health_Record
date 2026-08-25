namespace Electronic_Health_Record.Server.Models
{
    public class FamilyMedicalHistory
    {
        public int FMHID { get; set; }
        public int FormID { get; set; }
        public int? ConditionID { get; set; }
        public string? ConditionOther { get; set; }
        public string? FamilyMember { get; set; }
        public bool? IsNone { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

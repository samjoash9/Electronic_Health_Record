using Microsoft.Identity.Client;

namespace Electronic_Health_Record.Server.Models
{
    public class MedicalCondition
    {
        public int ConditionID { get; set; }
        public string ConditionName { get; set; } = string.Empty;
        public string ConditionType { get; set; } = string.Empty;
    }
}

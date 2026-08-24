namespace Electronic_Health_Record.Server.Models
{
    public class PastMedicalHistory
    {
        public int PMHID { get; set; }
        public int FormID { get; set; }
        public int ConditionID { get; set; }
        public string? ConditionOther { get; set; }
        public short? YearDiagnosed { get; set; }
        public string? MaintenanceDrugGeneric { get; set; }
        public string? Dosage { get; set; }
        public string? Frequency { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

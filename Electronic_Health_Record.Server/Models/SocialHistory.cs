namespace Electronic_Health_Record.Server.Models
{
    public class SocialHistory
    {
        public int SocialHistoryID { get; set;  }
        public int FormID { get; set; }
        public short? SmokingSticksPerDay { get; set; }
        public string? AlcoholType { get; set; }
        public string? DrinkFrequency { get; set; }
        public string? DrinksPerSession { get; set; }
        public bool? HasBeenDrunk { get; set; }
        public string? DrunkFrequency { get; set; }
        public string? ExerciseFrequency { get; set; }
        public string? ExerciseType { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

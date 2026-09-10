namespace Electronic_Health_Record.Server.Models
{
    public class SocialHistory
    {
        public int SocialHistoryID { get; set;  }
        public int FormID { get; set; }

        // null means unanswered; the Yes/No pair starts with neither selected
        public bool? Smokes { get; set; }

        public bool SmokesCigarette { get; set; }
        public string? CigaretteSticksPerDay { get; set; }
        public string? CigaretteFrequency { get; set; }
        public string? CigaretteYearStarted { get; set; }
        public string? CigarettePuffsPerDay { get; set; }

        public bool SmokesEcig { get; set; }
        public string? EcigPodsPerMonth { get; set; }
        public string? EcigFrequency { get; set; }
        public string? EcigYearStarted { get; set; }
        public string? EcigPuffsPerDay { get; set; }

        public string? AlcoholType { get; set; }
        public string? DrinkFrequency { get; set; }
        public string? DrinksPerSession { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

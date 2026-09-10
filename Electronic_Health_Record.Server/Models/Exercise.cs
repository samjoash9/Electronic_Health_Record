namespace Electronic_Health_Record.Server.Models
{
    public class Exercise
    {
        public int ExerciseID { get; set; }
        public int FormID { get; set; }
        public string ExerciseType { get; set; } = null!;
        public string? ExerciseFrequency { get; set; }
        public string? ExerciseYearStarted { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

namespace Electronic_Health_Record.Server.Services.Reports
{
    /// <summary>
    /// Server copies of the client's clinical cutoffs, for the dashboard's
    /// station reports. Each one mirrors the client file named beside it; a
    /// cutoff change has to be made in both places, or the dashboard and the
    /// patient's record will classify the same reading differently.
    ///
    /// !! NEEDS CLINICAL REVIEW !! -- inherited from every client file below.
    /// </summary>
    public static class ReportClassifiers
    {
        // lib/bmi.js bmiCategory: WHO Western Pacific (Asia-Pacific) cutoffs.
        public static string? BmiClass(decimal? bmi)
        {
            if (bmi is null) return null;
            if (bmi < 18.5m) return "underweight";
            if (bmi < 23m) return "normal";
            if (bmi < 25m) return "overweight";
            return "obese";
        }

        // The Health Reports page's five-way split: BmiClass with obese cut
        // at 30, the WPRO Obese Class II line. Built on BmiClass so the two
        // can never disagree -- obese1 + obese2 is always the dashboard's
        // obese. The page prints these ranges in BMI_FIVE_CLASSES
        // (features/reports/station1Health.js); change them together.
        public static string? BmiClassDetailed(decimal? bmi)
        {
            var bmiClass = BmiClass(bmi);
            if (bmiClass != "obese") return bmiClass;
            return bmi >= 30m ? "obese2" : "obese1";
        }

        // lib/bloodPressure.js bpClass: 2017 ACC/AHA, the worse reading decides.
        public static string? BpClass(short? systolic, short? diastolic)
        {
            if (systolic is null || diastolic is null) return null;
            if (systolic > 180 || diastolic > 120) return "crisis";
            if (systolic >= 140 || diastolic >= 90) return "stage2";
            if (systolic >= 130 || diastolic >= 80) return "stage1";
            if (systolic >= 120) return "elevated";
            return "normal";
        }

        // features/reports/IntakeFlagsCard.jsx FLAGS: adult resting cutoffs.
        // A null reading compares false, so it is never flagged.
        public static bool IsFever(decimal? tempCelsius) => tempCelsius >= 37.5m;
        public static bool IsTachycardia(short? heartRate) => heartRate > 100;
        public static bool IsBradycardia(short? heartRate) => heartRate < 60;
        public static bool IsTachypnea(short? respRate) => respRate > 20;

        // lib/interpretation.js scoreBand. Rounded to one decimal first, the
        // precision the client shows (and therefore bands) scores at.
        public static string? WellnessBand(double? percent)
        {
            if (percent is null) return null;
            var p = Math.Round(percent.Value, 1);
            if (p >= 90) return "excellent";
            if (p >= 75) return "good";
            if (p >= 65) return "fair";
            if (p >= 50) return "attention";
            return "support";
        }

        /// <summary>
        /// Median gap in minutes across the usable (start, end) pairs, to one
        /// decimal; null when none are usable. A pair missing either end, or
        /// ending before it started, is skipped.
        /// </summary>
        public static double? MedianMinutes(IEnumerable<(DateTime? Start, DateTime? End)> spans)
        {
            var minutes = spans
                .Where(s => s.Start is not null && s.End is not null && s.End >= s.Start)
                .Select(s => (s.End!.Value - s.Start!.Value).TotalMinutes)
                .OrderBy(m => m)
                .ToList();

            if (minutes.Count == 0) return null;

            var mid = minutes.Count / 2;
            var median = minutes.Count % 2 == 1
                ? minutes[mid]
                : (minutes[mid - 1] + minutes[mid]) / 2;
            return Math.Round(median, 1);
        }

        /// <summary>How many of the values equal each key, every key present (zero-filled), in key order.</summary>
        public static Dictionary<string, int> Tally(IEnumerable<string?> values, params string[] keys)
        {
            var list = values.ToList();
            return keys.ToDictionary(k => k, k => list.Count(v => v == k));
        }
    }
}

using Electronic_Health_Record.Server.DTOs.WellnessForm;

namespace Electronic_Health_Record.Server.Services
{
    /// <summary>
    /// The years a consultation's "year started" / "year diagnosed" answers may
    /// fall in: no earlier than the patient was born and no later than the
    /// visit. The client checks the same rule (lib/yearBounds.js) so a physician
    /// sees it while typing; the two must change together.
    /// </summary>
    public static class ConsultationYears
    {
        private const int Floor = 1900;

        /// <summary>
        /// The first answer outside the range, as a message naming it, or null
        /// when every year is blank or in range. A null list or social history
        /// is a section that was not sent, so it is not checked.
        /// </summary>
        public static string? FirstError(
            DateTime birthdate,
            int visitYear,
            IEnumerable<PastMedicalHistoryItemDto>? pastMedicalHistory,
            IEnumerable<ExerciseItemDto>? exercise,
            SocialHistoryDto? socialHistory)
        {
            // An unknown birthdate (HR sync stores DateTime.MinValue for one)
            // falls back to 1900 rather than rejecting every year.
            var fromBirthdate = birthdate.Year >= Floor && birthdate.Year <= visitYear;
            var min = fromBirthdate ? birthdate.Year : Floor;

            string? Check(string label, string? value)
            {
                if (string.IsNullOrWhiteSpace(value)) return null;

                var text = value.Trim();
                if (text.Length != 4 || !text.All(char.IsAsciiDigit))
                    return $"{label} must be a 4-digit year.";

                var year = int.Parse(text);
                if (year < min)
                {
                    return fromBirthdate
                        ? $"{label} ({year}) is before the patient's birth year ({min})."
                        : $"{label} ({year}) can't be before {min}.";
                }
                if (year > visitYear)
                    return $"{label} ({year}) can't be after the visit year ({visitYear}).";

                return null;
            }

            var pmhRow = 0;
            foreach (var row in pastMedicalHistory ?? [])
            {
                pmhRow++;
                if (Check($"Past medical history row {pmhRow}: year diagnosed", row.YearDiagnosed?.ToString())
                    is { } error)
                    return error;
            }

            // Checked whenever a value is present, whatever the smoking flags:
            // the client sends an unticked block's fields as null, so a year
            // here is one that will be stored.
            if (socialHistory is { } social)
            {
                if (Check("Cigarette year started", social.CigaretteYearStarted) is { } cigarette)
                    return cigarette;
                if (Check("E-cigarette year started", social.EcigYearStarted) is { } ecig)
                    return ecig;
            }

            var exerciseRow = 0;
            foreach (var row in exercise ?? [])
            {
                exerciseRow++;
                if (Check($"Exercise row {exerciseRow}: year started", row.ExerciseYearStarted) is { } error)
                    return error;
            }

            return null;
        }
    }
}

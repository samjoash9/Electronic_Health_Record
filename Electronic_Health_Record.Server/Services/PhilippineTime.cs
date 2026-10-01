namespace Electronic_Health_Record.Server.Services
{
    // Instants are stored in UTC, but calendar-day questions ("which forms are
    // from today?") have to be answered in the clinic's own timezone. Manila is
    // UTC+8 with no DST, so a UTC-based "today" would put the 00:00-08:00 PHT
    // window on the previous day.
    //
    // DateTime.Now is deliberately not used: it follows the host machine, which
    // is not guaranteed to be in Manila (containers and cloud hosts default to
    // UTC).
    public static class PhilippineTime
    {
        // Windows and Linux ship different ids for the same zone.
        private static readonly TimeZoneInfo Zone = ResolveZone();

        private static TimeZoneInfo ResolveZone()
        {
            foreach (var id in new[] { "Asia/Manila", "Singapore Standard Time" })
            {
                try
                {
                    return TimeZoneInfo.FindSystemTimeZoneById(id);
                }
                catch (TimeZoneNotFoundException) { }
                catch (InvalidTimeZoneException) { }
            }

            // Manila has had no DST since 1978, so a fixed offset is a safe last resort.
            return TimeZoneInfo.CreateCustomTimeZone("PHT", TimeSpan.FromHours(8), "Philippine Time", "Philippine Time");
        }

        /// <summary>Current wall-clock time in the Philippines.</summary>
        public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zone);

        /// <summary>Today's calendar date in the Philippines.</summary>
        public static DateTime Today => Now.Date;

        /// <summary>Renders a stored UTC timestamp as Philippine wall-clock time.</summary>
        public static DateTime ToPhilippineTime(DateTime utc)
        {
            var asUtc = utc.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(utc, DateTimeKind.Utc)
                : utc.ToUniversalTime();

            return TimeZoneInfo.ConvertTimeFromUtc(asUtc, Zone);
        }
    }
}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace Electronic_Health_Record.Server.Serialization
{
    // Every timestamp in this database is UTC: controllers write DateTime.UtcNow
    // and the SQL defaults use SYSUTCDATETIME(). The columns are datetime2, which
    // stores no offset, so EF hands the value back with DateTimeKind.Unspecified
    // and the default serializer writes it without a trailing "Z". The browser
    // then parses that offset-less string as *local* time, which shifted every
    // rendered timestamp 8 hours behind in Manila.
    //
    // Stamping Kind=Utc on the way out makes the wire format unambiguous, so
    // new Date(iso) on the client resolves to the correct instant and the PHT
    // formatting in src/lib/formatters.js has something true to convert from.
    public class UtcDateTimeConverter : JsonConverter<DateTime>
    {
        public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetDateTime();

            // An incoming payload that already carried an offset is converted;
            // one without is taken at face value as UTC, matching how we store it.
            return value.Kind switch
            {
                DateTimeKind.Local => value.ToUniversalTime(),
                DateTimeKind.Utc => value,
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            };
        }

        public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
        {
            var utc = value.Kind switch
            {
                DateTimeKind.Local => value.ToUniversalTime(),
                DateTimeKind.Utc => value,
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
            };

            writer.WriteStringValue(utc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"));
        }
    }

    // DateTime? goes through its own converter: System.Text.Json does not unwrap
    // nullables onto the non-nullable converter above.
    public class NullableUtcDateTimeConverter : JsonConverter<DateTime?>
    {
        private static readonly UtcDateTimeConverter Inner = new();

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null) return null;
            return Inner.Read(ref reader, typeof(DateTime), options);
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (value is null)
            {
                writer.WriteNullValue();
                return;
            }

            Inner.Write(writer, value.Value, options);
        }
    }
}

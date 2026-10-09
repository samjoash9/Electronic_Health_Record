using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class ReportRangeTests
{
    [Fact]
    public void Parses_an_inclusive_range_and_trims_the_office()
    {
        var ok = ReportRange.TryParse("2026-10-01", "2026-10-31", "  PROVINCIAL HEALTH OFFICE ", out var range, out var error);

        Assert.True(ok);
        Assert.Equal(new ReportRange(new DateTime(2026, 10, 1), new DateTime(2026, 10, 31), "PROVINCIAL HEALTH OFFICE"), range);
        Assert.Equal(string.Empty, error);
    }

    [Fact]
    public void Accepts_a_single_day()
    {
        Assert.True(ReportRange.TryParse("2026-10-05", "2026-10-05", null, out var range, out _));
        Assert.Equal(range.From, range.To);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Reads_a_blank_office_as_every_office(string? office)
    {
        Assert.True(ReportRange.TryParse("2026-10-01", "2026-10-31", office, out var range, out _));
        Assert.Null(range.Office);
    }

    [Theory]
    [InlineData(null, "2026-10-31")]
    [InlineData("2026-10-01", null)]
    [InlineData("10/01/2026", "2026-10-31")]
    [InlineData("2026-02-30", "2026-03-01")]
    public void Rejects_a_missing_or_malformed_date(string? from, string? to)
    {
        Assert.False(ReportRange.TryParse(from, to, null, out _, out var error));
        Assert.Equal("from and to are required as yyyy-MM-dd.", error);
    }

    [Fact]
    public void Rejects_a_range_that_ends_before_it_starts()
    {
        Assert.False(ReportRange.TryParse("2026-12-31", "2026-01-01", null, out _, out var error));
        Assert.Equal("from must not be after to.", error);
    }
}

public class ReportQueriesTests
{
    private sealed record Row(int FormID, int PatientID, DateTime FormDate);

    private static List<Row> Latest(params Row[] rows) =>
        ReportQueries.LatestPerPatient(rows, r => r.PatientID, r => r.FormDate, r => r.FormID);

    [Fact]
    public void LatestPerPatient_keeps_each_patients_latest_visit()
    {
        var latest = Latest(
            new Row(1, 7, new DateTime(2026, 3, 1)),
            new Row(2, 7, new DateTime(2026, 9, 1)),
            new Row(3, 8, new DateTime(2026, 5, 1)));

        Assert.Equal(new[] { 2, 3 }, latest.Select(r => r.FormID).OrderBy(id => id));
    }

    [Fact]
    public void LatestPerPatient_breaks_a_same_day_tie_on_the_later_form()
    {
        var latest = Latest(
            new Row(6, 7, new DateTime(2026, 9, 1)),
            new Row(5, 7, new DateTime(2026, 9, 1)));

        Assert.Equal(6, Assert.Single(latest).FormID);
    }
}

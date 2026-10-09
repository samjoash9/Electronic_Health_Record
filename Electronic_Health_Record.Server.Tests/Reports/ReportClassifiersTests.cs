using System.Globalization;
using Electronic_Health_Record.Server.Services.Reports;

namespace Electronic_Health_Record.Server.Tests.Reports;

public class ReportClassifiersTests
{
    [Theory]
    [InlineData("18.49", "underweight")]
    [InlineData("18.5", "normal")]
    [InlineData("22.99", "normal")]
    [InlineData("23", "overweight")]
    [InlineData("24.99", "overweight")]
    [InlineData("25", "obese1")]
    [InlineData("29.99", "obese1")]
    [InlineData("30", "obese2")]
    [InlineData("41.2", "obese2")]
    public void BmiClassDetailed_splits_obese_at_30(string bmi, string expected)
    {
        Assert.Equal(expected, ReportClassifiers.BmiClassDetailed(decimal.Parse(bmi, CultureInfo.InvariantCulture)));
    }

    [Fact]
    public void BmiClassDetailed_leaves_a_missing_reading_unclassified()
    {
        Assert.Null(ReportClassifiers.BmiClassDetailed(null));
    }

    [Fact]
    public void BmiClassDetailed_obese_classes_are_exactly_the_dashboards_obese()
    {
        for (var bmi = 10.0m; bmi <= 50.0m; bmi += 0.01m)
        {
            var dashboard = ReportClassifiers.BmiClass(bmi);
            var detailed = ReportClassifiers.BmiClassDetailed(bmi);

            if (dashboard == "obese")
                Assert.Contains(detailed, new[] { "obese1", "obese2" });
            else
                Assert.Equal(dashboard, detailed);
        }
    }
}

namespace Electronic_Health_Record.Server.DTOs.Reports;

public class AnalyticsReportPdfRequest
{
    public string? ConditionsChartBase64 { get; set; }
    public string? PatientEntryChartBase64 { get; set; }
    public string? WellnessAspectsChartBase64 { get; set; }
    public string? SmokerStatusChartBase64 { get; set; }
    public string? GeneratedBy { get; set; }
    public int TotalForms { get; set; }
    public int TotalPatients { get; set; }
    public int CompletedForms { get; set; }
}

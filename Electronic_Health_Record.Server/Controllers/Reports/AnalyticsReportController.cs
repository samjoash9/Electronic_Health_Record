using Electronic_Health_Record.Server.DTOs.Reports;
using Electronic_Health_Record.Server.Models;
using Electronic_Health_Record.Server.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;

namespace Electronic_Health_Record.Server.Controllers.Reports;

// Staff only, like the health reports it renders: rendering a PDF is CPU work
// an anonymous caller could otherwise trigger at will.
[ApiController]
[Route("api/reports")]
[Authorize(Policy = AuthPolicies.Staff)]
public class AnalyticsReportController : ControllerBase
{
    private readonly ILogger<AnalyticsReportController> _logger;

    public AnalyticsReportController(ILogger<AnalyticsReportController> logger)
    {
        _logger = logger;
    }

    [HttpPost("analytics-pdf")]
    public IActionResult GenerateAnalyticsPdf([FromBody] AnalyticsReportPdfRequest request)
    {
        try
        {
            var document = new AnalyticsReportDocument(request);
            var pdfBytes = document.GeneratePdf();

            return File(
                pdfBytes,
                "application/pdf",
                $"eHPR_Station_Analytics_Report_{DateTime.Now:yyyyMMdd_HHmm}.pdf"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate analytics PDF report");
            // The exception is logged above; its message stays server-side.
            return StatusCode(500, new { message = "Failed to generate analytics PDF report" });
        }
    }
}

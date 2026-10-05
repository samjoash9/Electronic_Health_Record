using Electronic_Health_Record.Server.DTOs.Reports;
using Electronic_Health_Record.Server.Services.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;

namespace Electronic_Health_Record.Server.Controllers.Reports;

[ApiController]
[Route("api/reports")]
[Authorize]
public class AnalyticsReportController : ControllerBase
{
    private readonly ILogger<AnalyticsReportController> _logger;

    public AnalyticsReportController(ILogger<AnalyticsReportController> logger)
    {
        _logger = logger;
    }

    [AllowAnonymous]
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
            return StatusCode(500, new { message = "Failed to generate analytics PDF report", error = ex.Message });
        }
    }
}

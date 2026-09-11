using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace Electronic_Health_Record.Server.Filters
{
    // The client's toApiError (src/api/client.js) reads only
    // error.response.data.message. ASP.NET's default ProblemDetails body exposes
    // title/detail instead, which the client never reads — every unhandled
    // exception would surface to the user as "Request failed with status code 500".
    // This filter guarantees a `message` field on every error response.
    public class ApiExceptionFilter : IExceptionFilter
    {
        private readonly ILogger<ApiExceptionFilter> _logger;
        private readonly IHostEnvironment _env;

        public ApiExceptionFilter(ILogger<ApiExceptionFilter> logger, IHostEnvironment env)
        {
            _logger = logger;
            _env = env;
        }

        public void OnException(ExceptionContext context)
        {
            _logger.LogError(context.Exception, "Unhandled exception on {Path}", context.HttpContext.Request.Path);

            var message = _env.IsDevelopment()
                ? context.Exception.Message
                : "An unexpected error occurred.";

            context.Result = new ObjectResult(new
            {
                message,
                detail = _env.IsDevelopment() ? context.Exception.ToString() : null
            })
            {
                StatusCode = StatusCodes.Status500InternalServerError,
            };
            context.ExceptionHandled = true;
        }
    }
}

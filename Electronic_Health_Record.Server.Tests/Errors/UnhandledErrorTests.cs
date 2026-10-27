using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Electronic_Health_Record.Server.Tests.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;

namespace Electronic_Health_Record.Server.Tests.Errors;

/// <summary>Stands in for any action that hits an exception it does not catch.</summary>
[ApiController]
[Route("api/test-only/throws")]
[AllowAnonymous]
public class ThrowingController : ControllerBase
{
    public const string Secret = "Server=DESKTOP-3FFHKTI;Password=hunter2";

    [HttpGet]
    public IActionResult Get() => throw new InvalidOperationException(Secret);
}

/// <summary>
/// An exception nobody caught must still come back as the { message } body the
/// client reads, and must not carry the exception's own text -- that is where
/// connection strings and SQL end up.
/// </summary>
public class UnhandledErrorTests(EhrApiFactory factory) : IClassFixture<EhrApiFactory>
{
    private HttpClient ClientWithThrowingAction() => factory
        .WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.AddControllers().AddApplicationPart(typeof(ThrowingController).Assembly)))
        .CreateClient(new() { BaseAddress = new Uri("https://localhost") });

    [Fact]
    public async Task Answers_an_unhandled_exception_with_a_generic_message()
    {
        var response = await ClientWithThrowingAction().GetAsync("/api/test-only/throws");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var raw = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain("hunter2", raw);
        var body = JsonSerializer.Deserialize<JsonElement>(raw);
        Assert.Equal("An unexpected error occurred.", body.GetProperty("message").GetString());
    }
}

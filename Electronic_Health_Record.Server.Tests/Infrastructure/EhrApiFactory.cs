using Electronic_Health_Record.Server.BackgroundJobs;
using Electronic_Health_Record.Server.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace Electronic_Health_Record.Server.Tests.Infrastructure;

/// <summary>
/// The real API -- routing, JSON binding, [Required] validation, JWT auth and
/// the controllers -- over an in-memory database, so the tests run without a
/// SQL Server. In-memory does not enforce foreign keys, and does not generate
/// rowversions; <see cref="RowVersionEmulator"/> stands in for the latter.
/// </summary>
public sealed class EhrApiFactory : WebApplicationFactory<Program>
{
    // 32+ bytes and not the placeholder, or Program.cs refuses to start.
    public const string JwtKey = "integration-tests-only-signing-key-0123456789";

    private readonly string _databaseName = $"ehr-tests-{Guid.NewGuid()}";

    static EhrApiFactory()
    {
        // Program.cs reads the JWT settings off builder.Configuration before
        // the host is built, which is earlier than any ConfigureAppConfiguration
        // override applies -- environment variables are already in by then.
        Environment.SetEnvironmentVariable("Jwt__Key", JwtKey);
        Environment.SetEnvironmentVariable("Seed__DevFixtures", "false");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            // Every trace of the SQL Server registration has to go: EF refuses
            // a context configured for two providers.
            var sqlServer = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<ElectronicHealthRecordDbContext>)
                         || d.ServiceType == typeof(DbContextOptions)
                         || d.ServiceType == typeof(IDbContextOptionsConfiguration<ElectronicHealthRecordDbContext>))
                .ToList();
            foreach (var descriptor in sqlServer)
                services.Remove(descriptor);

            services.AddDbContext<ElectronicHealthRecordDbContext>(options => options
                .UseInMemoryDatabase(_databaseName)
                .AddInterceptors(new RowVersionEmulator())
                // The controllers wrap each submit in a transaction; in-memory
                // has none, and would otherwise throw on BeginTransaction.
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)));

            // Calls the external HR API on a timer.
            var hrSync = services.Single(d => d.ImplementationType == typeof(EmployeeSyncBackgroundService));
            services.Remove(hrSync);
        });
    }

    protected override void ConfigureClient(HttpClient client)
    {
        // https so UseHttpsRedirection has nothing to redirect.
        client.BaseAddress = new Uri("https://localhost");
    }
}

using Electronic_Health_Record.Server.Services;

namespace Electronic_Health_Record.Server.BackgroundJobs
{
    public class EmployeeSyncBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<EmployeeSyncBackgroundService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(4);

        public EmployeeSyncBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<EmployeeSyncBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Running scheduled employee sync (every 4 minutes).");

                    using var scope = _scopeFactory.CreateScope();
                    var employeeService = scope.ServiceProvider
                        .GetRequiredService<IEmployeeService>();

                    await employeeService.GetEmployeesAsync();

                    _logger.LogInformation("Scheduled employee sync completed.");
                }
                catch (Exception ex)
                {
                    // Don't kill the loop — just log and retry next interval.
                    _logger.LogError(ex, "Scheduled employee sync failed.");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }
    }
}
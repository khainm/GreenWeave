using backend.Interfaces.Services;

namespace backend.Services
{
    public class ViettelPostTokenRefreshService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ViettelPostTokenRefreshService> _logger;
        private readonly TimeSpan _refreshInterval = TimeSpan.FromHours(6); // Check every 6 hours

        public ViettelPostTokenRefreshService(
            IServiceProvider serviceProvider,
            ILogger<ViettelPostTokenRefreshService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ViettelPost Token Refresh Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var authService = scope.ServiceProvider.GetRequiredService<IViettelPostAuthService>();

                    // Check if token needs refresh (will auto-refresh if needed)
                    if (!authService.IsTokenValid())
                    {
                        _logger.LogInformation("ViettelPost token needs refresh - refreshing automatically");
                        await authService.RefreshTokenAsync();
                        _logger.LogInformation("ViettelPost token refreshed successfully by background service");
                    }
                    else
                    {
                        _logger.LogDebug("ViettelPost token still valid, no refresh needed");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in ViettelPost token refresh background service");
                }

                // Wait for next check
                await Task.Delay(_refreshInterval, stoppingToken);
            }

            _logger.LogInformation("ViettelPost Token Refresh Service stopped");
        }
    }
}
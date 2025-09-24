using backend.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace backend.Services
{
    public class ViettelPostPrintService : IViettelPostPrintService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ViettelPostPrintService> _logger;
        private readonly string _baseUrl;
        private readonly string _token;
        private readonly string _printToken;

        public ViettelPostPrintService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ViettelPostPrintService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            var shippingConfig = _configuration.GetSection("Shipping:ViettelPost");
            _baseUrl = shippingConfig["BaseUrl"] ?? "https://partner.viettelpost.vn/v2";
            _token = shippingConfig["Token"] ?? string.Empty;
            _printToken = shippingConfig["PrintToken"] ?? string.Empty;

            _httpClient.BaseAddress = new Uri(_baseUrl);
            _httpClient.DefaultRequestHeaders.Add("Token", _token);
        }

        public async Task<backend.Interfaces.Services.PrintLinkResult> GeneratePrintLinkAsync(string[] orderNumbers, int expiryDays = 7)
        {
            try
            {
                if (string.IsNullOrEmpty(_printToken))
                {
                    _logger.LogError("Print token is not configured");
                    return new backend.Interfaces.Services.PrintLinkResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Print token chưa được cấu hình"
                    };
                }

                var expiryTime = DateTimeOffset.UtcNow.AddDays(expiryDays).ToUnixTimeMilliseconds();

                var request = new PrintLinkRequest
                {
                    Type = 1,
                    OrderArray = orderNumbers,
                    ExpiryTime = expiryTime,
                    PrintToken = _printToken
                };

                _logger.LogInformation("Generating print link for orders: {OrderNumbers}", string.Join(", ", orderNumbers));

                var jsonContent = JsonSerializer.Serialize(request, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                var content = new StringContent(jsonContent, System.Text.Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync("/order/encryptLinkPrint", content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("ViettelPost print link response: {Response}", responseContent);

                if (response.IsSuccessStatusCode)
                {
                    var result = JsonSerializer.Deserialize<ViettelPostPrintResponse>(responseContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (result?.Status == 200 && !result.Error)
                    {
                        _logger.LogInformation("Print link generated successfully: {Link}", result.Message);
                        return new backend.Interfaces.Services.PrintLinkResult
                        {
                            IsSuccess = true,
                            PrintLink = result.Message,
                            ExpiryTime = DateTimeOffset.FromUnixTimeMilliseconds(expiryTime)
                        };
                    }
                    else
                    {
                        _logger.LogError("ViettelPost API returned error: {Status}, {Message}", result?.Status, result?.Message);
                        return new backend.Interfaces.Services.PrintLinkResult
                        {
                            IsSuccess = false,
                            ErrorMessage = result?.Message ?? "Lỗi không xác định từ ViettelPost"
                        };
                    }
                }
                else
                {
                    _logger.LogError("Failed to generate print link. Status: {Status}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    return new backend.Interfaces.Services.PrintLinkResult
                    {
                        IsSuccess = false,
                        ErrorMessage = $"Lỗi HTTP {response.StatusCode}: {responseContent}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating print link for orders: {OrderNumbers}", string.Join(", ", orderNumbers));
                return new backend.Interfaces.Services.PrintLinkResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Lỗi khi tạo link in: {ex.Message}"
                };
            }
        }
    }

    public class PrintLinkRequest
    {
        public int Type { get; set; }
        public string[] OrderArray { get; set; } = Array.Empty<string>();
        public long ExpiryTime { get; set; }
        public string PrintToken { get; set; } = string.Empty;
    }

    public class ViettelPostPrintResponse
    {
        public int Status { get; set; }
        public bool Error { get; set; }
        public string Message { get; set; } = string.Empty;
    }

}

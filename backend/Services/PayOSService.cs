using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend.Services
{
    public class PayOSService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _clientId;
        private readonly string _endpoint;

        public PayOSService(HttpClient httpClient, string apiKey, string clientId, string endpoint)
        {
            _httpClient = httpClient;
            _apiKey = apiKey;
            _clientId = clientId;
            _endpoint = endpoint;
        }

        public async Task<string> CreatePaymentLinkAsync(decimal amount, string orderId, string description, string returnUrl)
        {
            var payload = new
            {
                amount = amount,
                orderId = orderId,
                description = description,
                returnUrl = returnUrl,
                clientId = _clientId
            };
            var json = JsonSerializer.Serialize(payload);
            var request = new HttpRequestMessage(HttpMethod.Post, _endpoint)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            var responseBody = await response.Content.ReadAsStringAsync();
            // Giả sử responseBody có trường paymentUrl
            using var doc = JsonDocument.Parse(responseBody);
            var paymentUrl = doc.RootElement.TryGetProperty("paymentUrl", out var p) ? p.GetString() ?? string.Empty : string.Empty;
            return paymentUrl;
        }
    }
}

using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    /// <summary>
    /// Service for WebhookLog operations
    /// </summary>
    public class WebhookLogService : IWebhookLogService
    {
        private readonly IWebhookLogRepository _webhookLogRepository;
        private readonly ILogger<WebhookLogService> _logger;

        public WebhookLogService(
            IWebhookLogRepository webhookLogRepository,
            ILogger<WebhookLogService> logger)
        {
            _webhookLogRepository = webhookLogRepository;
            _logger = logger;
        }

        public async Task<WebhookLogListResult> GetAllAsync(int page = 1, int pageSize = 50)
        {
            try
            {
                var webhookLogs = await _webhookLogRepository.GetAllAsync(page, pageSize);
                var totalCount = await _webhookLogRepository.GetStatsAsync();
                
                var webhookLogDtos = webhookLogs.Select(MapToDto).ToList();
                var totalPages = (int)Math.Ceiling((double)totalCount.TotalWebhooks / pageSize);

                return new WebhookLogListResult
                {
                    IsSuccess = true,
                    Message = "Lấy danh sách webhook logs thành công",
                    WebhookLogs = webhookLogDtos,
                    TotalCount = totalCount.TotalWebhooks,
                    Page = page,
                    PageSize = pageSize,
                    TotalPages = totalPages
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook logs");
                return new WebhookLogListResult
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy danh sách webhook logs",
                    WebhookLogs = new List<WebhookLogDto>()
                };
            }
        }

        public async Task<List<WebhookLogDto>> GetByOrderNumberAsync(string orderNumber)
        {
            try
            {
                var webhookLogs = await _webhookLogRepository.GetByOrderNumberAsync(orderNumber);
                return webhookLogs.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook logs by order number: {OrderNumber}", orderNumber);
                return new List<WebhookLogDto>();
            }
        }

        public async Task<List<WebhookLogDto>> GetByOrderIdAsync(int orderId)
        {
            try
            {
                var webhookLogs = await _webhookLogRepository.GetByOrderIdAsync(orderId);
                return webhookLogs.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook logs by order ID: {OrderId}", orderId);
                return new List<WebhookLogDto>();
            }
        }

        public async Task<WebhookLogDto?> GetByIdAsync(int id)
        {
            try
            {
                var webhookLog = await _webhookLogRepository.GetByIdAsync(id);
                return webhookLog != null ? MapToDto(webhookLog) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook log by ID: {Id}", id);
                return null;
            }
        }

        public async Task<WebhookStatsDto> GetStatsAsync()
        {
            try
            {
                var stats = await _webhookLogRepository.GetStatsAsync();
                return new WebhookStatsDto
                {
                    TotalWebhooks = stats.TotalWebhooks,
                    SuccessfulWebhooks = stats.SuccessfulWebhooks,
                    FailedWebhooks = stats.FailedWebhooks,
                    LastWebhookTime = stats.LastWebhookTime,
                    RecentOrderNumbers = stats.RecentOrderNumbers
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting webhook stats");
                return new WebhookStatsDto();
            }
        }

        public async Task<List<WebhookLogDto>> GetRecentAsync(int count = 10)
        {
            try
            {
                var webhookLogs = await _webhookLogRepository.GetRecentAsync(count);
                return webhookLogs.Select(MapToDto).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent webhook logs");
                return new List<WebhookLogDto>();
            }
        }

        public async Task<WebhookLogDto> LogWebhookAsync(
            ViettelPostWebhookData webhookData, 
            bool isSuccess, 
            string? errorMessage = null,
            int? orderId = null,
            int? shippingRequestId = null)
        {
            try
            {
                var orderNumber = webhookData.DATA.ORDER_NUMBER;
                var status = webhookData.DATA.ORDER_STATUS;
                var note = webhookData.DATA.NOTE;

                var webhookLog = new WebhookLog
                {
                    OrderNumber = orderNumber,
                    OrderReference = webhookData.DATA.ORDER_REFERENCE,
                    OrderStatusDate = webhookData.DATA.ORDER_STATUSDATE,
                    OrderStatus = status,
                    StatusDescription = GetViettelPostStatusDescription(status),
                    Note = note,
                    MoneyCollection = webhookData.DATA.MONEY_COLLECTION,
                    MoneyFeeCod = webhookData.DATA.MONEY_FEECOD,
                    MoneyTotal = webhookData.DATA.MONEY_TOTAL,
                    ExpectedDelivery = webhookData.DATA.EXPECTED_DELIVERY,
                    ProductWeight = webhookData.DATA.PRODUCT_WEIGHT,
                    OrderService = webhookData.DATA.ORDER_SERVICE,
                    Token = webhookData.TOKEN,
                    IsSuccess = isSuccess,
                    ErrorMessage = errorMessage,
                    RawData = System.Text.Json.JsonSerializer.Serialize(webhookData),
                    OrderId = orderId,
                    ShippingRequestId = shippingRequestId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createdLog = await _webhookLogRepository.AddAsync(webhookLog);
                _logger.LogInformation("Webhook logged successfully for order {OrderNumber}", orderNumber);
                
                return MapToDto(createdLog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging webhook for order {OrderNumber}", webhookData.DATA.ORDER_NUMBER);
                throw;
            }
        }

        private static WebhookLogDto MapToDto(WebhookLog webhookLog)
        {
            return new WebhookLogDto
            {
                Id = webhookLog.Id,
                OrderNumber = webhookLog.OrderNumber,
                OrderReference = webhookLog.OrderReference,
                OrderStatusDate = webhookLog.OrderStatusDate,
                OrderStatus = webhookLog.OrderStatus,
                StatusDescription = webhookLog.StatusDescription,
                Note = webhookLog.Note,
                MoneyCollection = webhookLog.MoneyCollection,
                MoneyFeeCod = webhookLog.MoneyFeeCod,
                MoneyTotal = webhookLog.MoneyTotal,
                ExpectedDelivery = webhookLog.ExpectedDelivery,
                ProductWeight = webhookLog.ProductWeight,
                OrderService = webhookLog.OrderService,
                Token = webhookLog.Token,
                IsSuccess = webhookLog.IsSuccess,
                ErrorMessage = webhookLog.ErrorMessage,
                RawData = webhookLog.RawData,
                OrderId = webhookLog.OrderId,
                ShippingRequestId = webhookLog.ShippingRequestId,
                CreatedAt = webhookLog.CreatedAt,
                UpdatedAt = webhookLog.UpdatedAt
            };
        }

        private static string GetViettelPostStatusDescription(int status)
        {
            return status switch
            {
                -100 => "Đơn hàng mới tạo, chưa được duyệt",
                -108 => "Đơn hàng đã gửi tại bưu cục",
                -109 => "Đơn hàng đã gửi tại điểm tập kết",
                -110 => "Đơn hàng được bàn giao bởi bưu cục",
                -15 => "Hủy đơn hàng - Trạng thái kết thúc",
                100 => "Nhận đơn hàng của khách hàng - ViettelPost đang xử lý đơn hàng",
                101 => "ViettelPost yêu cầu khách hàng hủy đơn hàng",
                102 => "Đơn hàng đang được xử lý",
                103 => "Giao đến Bưu cục - ViettelPost đang xử lý đơn hàng",
                104 => "Giao đến người nhận - Bưu tá",
                105 => "Bưu tá đã nhận đơn hàng",
                106 => "Đối tác yêu cầu thu hồi đơn hàng",
                107 => "Đối tác yêu cầu hủy đơn hàng qua API",
                200 => "Nhận từ Bưu tá - Bưu cục nhận",
                201 => "Hủy nhập phiếu gửi",
                202 => "Sửa phiếu gửi",
                300 => "Đóng file giao hàng",
                301 => "Đóng gói giao hàng - Giao từ",
                302 => "Đóng track thư giao hàng - Giao từ",
                303 => "Đóng làn xe tải giao hàng - Giao từ",
                400 => "Nhận file thu nhập - Nhận tại",
                401 => "Nhận túi bưu phẩm - Nhận tại",
                402 => "Nhận track thư - Nhận tại",
                403 => "Nhận làn xe tải - Nhận tại",
                500 => "Giao đến Bưu tá giao hàng",
                501 => "Thành công - Giao hàng thành công",
                502 => "Giao trả về Bưu cục người gửi",
                503 => "Hủy - Theo yêu cầu của khách hàng",
                504 => "Thành công - Giao trả về khách hàng",
                505 => "Tồn kho - Giao trả về Bưu cục người gửi",
                506 => "Tồn kho - Khách hàng không nhận",
                507 => "Tồn kho - Khách hàng nhận tại Bưu cục",
                508 => "Đang giao hàng",
                509 => "Giao đến Bưu cục khác",
                510 => "Hủy giao hàng",
                515 => "Bưu cục giao hàng trả đơn hàng chờ duyệt",
                550 => "Yêu cầu Bưu cục giao hàng gửi lại",
                _ => $"Trạng thái không xác định ({status})"
            };
        }
    }
}

using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// 📋 ViettelPost webhook data structure according to official API v2 documentation
    /// ✅ Compliant with ViettelPost production webhook requirements
    /// </summary>
    public class ViettelPostWebhookData
    {
        /// <summary>Order tracking and status information</summary>
        [Required]
        public ViettelPostOrderData? DATA { get; set; }
        
        /// <summary>Security token for webhook verification (required by ViettelPost)</summary>
        [Required]
        public string? TOKEN { get; set; }
    }

    /// <summary>
    /// 📦 ViettelPost order data structure with all standard fields per API specification
    /// </summary>
    public class ViettelPostOrderData
    {
        /// <summary>ViettelPost tracking number (required) - PRIMARY KEY for order lookup</summary>
        [Required]
        public string? ORDER_NUMBER { get; set; }
        
        /// <summary>Customer reference number (optional)</summary>
        public string? ORDER_REFERENCE { get; set; }
        
        /// <summary>Status update timestamp (format: dd/MM/yyyy H:m:s) - REQUIRED</summary>
        [Required]
        public string? ORDER_STATUSDATE { get; set; }
        
        /// <summary>
        /// Order status code (REQUIRED). Standard ViettelPost values:
        /// -100: Đơn hàng mới tạo, chưa được duyệt
        /// -108: Đơn hàng đã gửi tại bưu cục  
        /// -109: Đơn hàng đã gửi tại điểm tập kết
        /// -110: Đơn hàng được bàn giao bởi bưu cục
        /// -15: Hủy đơn hàng - Trạng thái kết thúc ❌ END STATE
        /// 100: Nhận đơn hàng của khách hàng - ViettelPost đang xử lý
        /// 101: ViettelPost yêu cầu khách hàng hủy đơn hàng
        /// 102: Đơn hàng đang được xử lý
        /// 103: Giao đến Bưu cục - ViettelPost đang xử lý
        /// 104: Giao đến người nhận - Bưu tá
        /// 105: Bưu tá đã nhận đơn hàng
        /// 106: Đối tác yêu cầu thu hồi đơn hàng
        /// 107: Đối tác yêu cầu hủy đơn hàng qua API
        /// 200: Nhận từ Bưu tá - Bưu cục nhận
        /// 201: Hủy nhập phiếu gửi
        /// 202: Sửa phiếu gửi
        /// 300: Đóng file giao hàng
        /// 301: Đóng gói giao hàng - Giao từ
        /// 302: Đóng track thư giao hàng - Giao từ
        /// 303: Đóng làn xe tải giao hàng - Giao từ
        /// 400: Nhận file thu nhập - Nhận tại
        /// 401: Nhận túi bưu phẩm - Nhận tại
        /// 402: Nhận track thư - Nhận tại
        /// 403: Nhận làn xe tải - Nhận tại
        /// 500: Giao đến Bưu tá giao hàng
        /// 501: Thành công - Giao hàng thành công ✅ DELIVERED
        /// 502: Giao trả về Bưu cục người gửi
        /// 503: Hủy - Theo yêu cầu của khách hàng ❌ CANCELLED
        /// 504: Thành công - Giao trả về khách hàng
        /// 505: Tồn kho - Giao trả về Bưu cục người gửi
        /// 506: Tồn kho - Khách hàng không nhận
        /// 507: Tồn kho - Khách hàng nhận tại Bưu cục
        /// 508: Đang giao hàng 🚚 OUT_FOR_DELIVERY
        /// 509: Giao đến Bưu cục khác
        /// 510: Hủy giao hàng
        /// 515: Bưu cục giao hàng trả đơn hàng chờ duyệt
        /// 550: Yêu cầu Bưu cục giao hàng gửi lại
        /// </summary>
        [Required]
        public int ORDER_STATUS { get; set; }
        
        /// <summary>Human-readable status description (Vietnamese)</summary>
        public string? STATUS_NAME { get; set; }
        
        /// <summary>Current location of the package (may contain typo LOCALION instead of LOCATION)</summary>
        public string? LOCALION_CURRENTLY { get; set; }
        
        /// <summary>Additional notes from delivery personnel or system</summary>
        public string? NOTE { get; set; }
        
        /// <summary>Cash on delivery amount collected (VND)</summary>
        public decimal MONEY_COLLECTION { get; set; }
        
        /// <summary>COD service fee charged (VND)</summary>
        public decimal MONEY_FEECOD { get; set; }
        
        /// <summary>Total shipping fee (VND)</summary>
        public decimal MONEY_TOTAL { get; set; }
        
        /// <summary>Expected delivery date (format may vary)</summary>
        public string? EXPECTED_DELIVERY { get; set; }
        
        /// <summary>Package weight in grams</summary>
        public decimal PRODUCT_WEIGHT { get; set; }
        
        /// <summary>Shipping service type code</summary>
        public string? ORDER_SERVICE { get; set; }
    }
}
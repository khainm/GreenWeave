namespace backend.Interfaces.Services
{
    public interface IViettelPostPrintService
    {
        /// <summary>
        /// Tạo link in hóa đơn từ ViettelPost
        /// </summary>
        /// <param name="orderNumbers">Danh sách mã đơn hàng</param>
        /// <param name="expiryDays">Số ngày hết hạn (mặc định 7 ngày)</param>
        /// <returns>Kết quả tạo link in</returns>
        Task<PrintLinkResult> GeneratePrintLinkAsync(string[] orderNumbers, int expiryDays = 7);
    }

    public class PrintLinkResult
    {
        public bool IsSuccess { get; set; }
        public string PrintLink { get; set; } = string.Empty;
        public DateTimeOffset ExpiryTime { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
    }
}

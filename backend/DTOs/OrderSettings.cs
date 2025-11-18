namespace backend.DTOs
{
    public class OrderSettings
    {
        /// <summary>
        /// Tự động confirm order sau khi thanh toán thành công (cho PayOS, BankTransfer)
        /// </summary>
        public bool AutoConfirmOnPayment { get; set; } = false;
        public string[] AutoConfirmPaymentMethods { get; set; } = System.Array.Empty<string>();
        
        /// <summary>
        /// Tự động confirm order ngay khi tạo (cho COD - Cash On Delivery)
        /// </summary>
        public bool AutoConfirmOnCreate { get; set; } = false;
        public string[] AutoConfirmCreateMethods { get; set; } = System.Array.Empty<string>();
    }
}

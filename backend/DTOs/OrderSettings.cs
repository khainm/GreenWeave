namespace backend.DTOs
{
    public class OrderSettings
    {
        public bool AutoConfirmOnPayment { get; set; } = false;
        public string[] AutoConfirmPaymentMethods { get; set; } = System.Array.Empty<string>();
    }
}

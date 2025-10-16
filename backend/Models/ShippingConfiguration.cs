namespace backend.Models
{
    /// <summary>
    /// Configuration for all shipping providers
    /// </summary>
    public class ShippingConfiguration
    {
        public const string SectionName = "Shipping";

        /// <summary>
        /// Current environment: Production, Sandbox, Development
        /// </summary>
        public string Environment { get; set; } = "Production";

        public ViettelPostConfiguration ViettelPost { get; set; } = new();
    }

    /// <summary>
    /// Viettel Post API configuration
    /// </summary>
    public class ViettelPostConfiguration
    {
        public string BaseUrl { get; set; } = "https://partner.viettelpost.vn/v2";
        public string Token { get; set; } = string.Empty;
        public string PartnerID { get; set; } = string.Empty;
        public int TimeoutSeconds { get; set; } = 30;
        public bool IsEnabled { get; set; } = false;
        
        /// <summary>
        /// Default service type for Viettel Post (VCN, VHT, etc.)
        /// </summary>
        public string DefaultServiceId { get; set; } = "VCN";
        
        /// <summary>
        /// Default pickup address 
        /// ⚠️ DEPRECATED: This will be replaced by warehouse management system.
        /// Use IWarehouseService.GetDefaultPickupAddressAsync() instead.
        /// Kept only as emergency fallback during transition period.
        /// </summary>
        [Obsolete("Use IWarehouseService.GetDefaultPickupAddressAsync() instead. This property will be removed in future version.")]
        public ViettelPostAddress DefaultPickupAddress { get; set; } = new();

        /// <summary>
        /// 🔥 Business Rules and Limits Configuration 
        /// </summary>
        public ViettelPostBusinessRules BusinessRules { get; set; } = new();
    }

    /// <summary>
    /// 🔥 ViettelPost Business Rules và Limits để tránh hard-coding
    /// </summary>
    public class ViettelPostBusinessRules
    {
        /// <summary>
        /// Maximum weight limit in grams (default: 30kg = 30000g)
        /// </summary>
        public int MaxWeightGrams { get; set; } = 30000;

        /// <summary>
        /// Minimum weight in grams (default: 1g)
        /// </summary>
        public int MinWeightGrams { get; set; } = 1;

        /// <summary>
        /// Maximum insurance value (default: 50 million VND)
        /// </summary>
        public decimal MaxInsuranceValue { get; set; } = 50_000_000;

        /// <summary>
        /// Maximum COD amount (default: 50 million VND)
        /// </summary>
        public decimal MaxCodAmount { get; set; } = 50_000_000;

        /// <summary>
        /// Retry delay in milliseconds for API calls
        /// </summary>
        public int RetryDelayMs { get; set; } = 1000;

        /// <summary>
        /// Maximum retry attempts for failed API calls
        /// </summary>
        public int MaxRetryAttempts { get; set; } = 3;

        /// <summary>
        /// Service types configuration
        /// </summary>
        public ViettelPostServiceTypes ServiceTypes { get; set; } = new();

        /// <summary>
        /// Product types configuration
        /// </summary>
        public ViettelPostProductTypes ProductTypes { get; set; } = new();

        /// <summary>
        /// Payment method mappings
        /// </summary>
        public ViettelPostPaymentMethods PaymentMethods { get; set; } = new();
    }

    /// <summary>
    /// ViettelPost Service Types Configuration
    /// </summary>
    public class ViettelPostServiceTypes
    {
        /// <summary>
        /// Viettel Post Chuyển phát nhanh
        /// </summary>
        public string Express { get; set; } = "VCN";

        /// <summary>
        /// Viettel Post Hàng tiêu chuẩn
        /// </summary>
        public string Standard { get; set; } = "VHT";

        /// <summary>
        /// Default service type to use
        /// </summary>
        public string Default { get; set; } = "VCN";

        /// <summary>
        /// Service display names mapping - UPDATED to match ViettelPost API response
        /// </summary>
        public Dictionary<string, string> DisplayNames { get; set; } = new()
        {
            // Main services from API
            ["VCN"] = "VCN Chuyển phát nhanh",
            ["VHT"] = "Viettel Post Hàng tiêu chuẩn", 
            ["VTK"] = "Viettel Post Siêu tốc",
            ["VBS"] = "Viettel Post Bưu kiện",
            ["VBE"] = "Chuyển phát tiết kiệm theo Hộp",
            
            // Additional service codes based on ViettelPost API
            ["VTT"] = "Viettel Post Tận tay",
            ["VCH"] = "Viettel Post Chuyển hoàn",
            ["VGD"] = "Viettel Post Giao điểm",
            ["VNG"] = "Viettel Post Ngoại tỉnh"
        };

        /// <summary>
        /// Estimated delivery days mapping - UPDATED to match API response patterns
        /// </summary>
        public Dictionary<string, int> EstimatedDeliveryDays { get; set; } = new()
        {
            ["VCN"] = 2,  // Chuyển phát nhanh: ~48 giờ
            ["VHT"] = 4,  // Hàng tiêu chuẩn: 3-5 ngày
            ["VTK"] = 1,  // Siêu tốc: trong ngày hoặc 1 ngày
            ["VBS"] = 3,  // Bưu kiện: 2-4 ngày
            ["VBE"] = 6,  // Tiết kiệm theo hộp: ~144 giờ = 6 ngày
            
            // Additional mappings
            ["VTT"] = 2,  // Tận tay
            ["VCH"] = 3,  // Chuyển hoàn
            ["VGD"] = 1,  // Giao điểm
            ["VNG"] = 4   // Ngoại tỉnh
        };
    }

    /// <summary>
    /// ViettelPost Product Types Configuration
    /// </summary>
    public class ViettelPostProductTypes
    {
        /// <summary>
        /// Hàng hóa thông thường
        /// </summary>
        public string Goods { get; set; } = "HH";

        /// <summary>
        /// Thư/Envelope  
        /// </summary>
        public string Document { get; set; } = "TH";

        /// <summary>
        /// Default product type
        /// </summary>
        public string Default { get; set; } = "HH";
    }

    /// <summary>
    /// ViettelPost Payment Method Mappings
    /// </summary>
    public class ViettelPostPaymentMethods
    {
        /// <summary>
        /// Người gửi thanh toán (Prepaid)
        /// </summary>
        public int SenderPay { get; set; } = 1;

        /// <summary>
        /// Người nhận thanh toán (Postpaid)
        /// </summary>
        public int ReceiverPay { get; set; } = 2;

        /// <summary>
        /// Thu hộ (Cash on Delivery)
        /// </summary>
        public int CashOnDelivery { get; set; } = 3;
    }


    /// <summary>
    /// Viettel Post address structure
    /// </summary>
    public class ViettelPostAddress
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AddressDetail { get; set; } = string.Empty;
        public int ProvinceId { get; set; }
        public int DistrictId { get; set; }
        public int WardId { get; set; }
        public string ProvinceName { get; set; } = string.Empty;
        public string DistrictName { get; set; } = string.Empty;
        public string WardName { get; set; } = string.Empty;
        public int? GroupAddressId { get; set; }
    }
}

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
        /// </summary>
        public ViettelPostAddress DefaultPickupAddress { get; set; } = new();
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

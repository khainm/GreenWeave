using System.Text.RegularExpressions;
using backend.Models;

namespace backend.Utilities
{
    /// <summary>
    /// Enhanced address validation result with detailed information
    /// </summary>
    public class AddressValidationResult
    {
        public bool IsValid { get; set; } = false;
        public string? MatchedProvince { get; set; }
        public string? ValidationStrategy { get; set; }
        public string[]? Suggestions { get; set; }
        public string? ErrorMessage { get; set; }
        public Dictionary<string, object>? AdditionalData { get; set; }
    }

    /// <summary>
    /// Shipping-specific address validation result
    /// </summary>
    public class ShippingAddressValidationResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new List<string>();
        public List<string> Warnings { get; set; } = new List<string>();
    }

    public static class AddressValidator
    {
        // Vietnamese phone number patterns
        private static readonly Regex VietnamesePhoneRegex = new Regex(
            @"^(\+84|84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-9])[0-9]{7}$",
            RegexOptions.Compiled
        );

        // Vietnamese name patterns (allowing Unicode characters)
        private static readonly Regex VietnameseNameRegex = new Regex(
            @"^[\p{L}\p{M}\s]{2,50}$",
            RegexOptions.Compiled
        );

        // Address line validation (basic structure check)
        private static readonly Regex AddressLineRegex = new Regex(
            @"^[\p{L}\p{M}\p{N}\s,./\-_()]{5,200}$",
            RegexOptions.Compiled
        );

        // List of valid Vietnamese provinces with common variations
        private static readonly HashSet<string> ValidProvinces = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh",
            "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau",
            "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
            "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang",
            "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
            "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
            "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam",
            "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh",
            "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
            "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
            "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
            
            // 🚀 ENCODING VARIATIONS: Add common encoding variations
            "Bình Ðịnh",  // Latin D with stroke variation
            "Đăk Lăk",    // Alternative spelling
            "Đăk Nông",   // Alternative spelling
        };

        public static ShippingAddressValidationResult ValidateForShipping(UserAddress address)
        {
            var result = new ShippingAddressValidationResult { IsValid = true };

            // Validate full name
            if (string.IsNullOrWhiteSpace(address.FullName))
            {
                result.Errors.Add("Họ tên không được để trống");
                result.IsValid = false;
            }
            else if (!VietnameseNameRegex.IsMatch(address.FullName.Trim()))
            {
                result.Errors.Add("Họ tên chỉ được chứa chữ cái và khoảng trắng (2-50 ký tự)");
                result.IsValid = false;
            }

            // Validate phone number
            if (string.IsNullOrWhiteSpace(address.PhoneNumber))
            {
                result.Errors.Add("Số điện thoại không được để trống");
                result.IsValid = false;
            }
            else if (!VietnamesePhoneRegex.IsMatch(address.PhoneNumber.Trim()))
            {
                result.Errors.Add("Số điện thoại không đúng định dạng Việt Nam");
                result.IsValid = false;
            }

            // Validate address line
            if (string.IsNullOrWhiteSpace(address.AddressLine))
            {
                result.Errors.Add("Địa chỉ cụ thể không được để trống");
                result.IsValid = false;
            }
            else if (!AddressLineRegex.IsMatch(address.AddressLine.Trim()))
            {
                result.Errors.Add("Địa chỉ cụ thể không đúng định dạng (5-200 ký tự)");
                result.IsValid = false;
            }

            // Validate province
            if (string.IsNullOrWhiteSpace(address.Province))
            {
                result.Errors.Add("Tỉnh/Thành phố không được để trống");
                result.IsValid = false;
            }
            else 
            {
                var normalizedProvince = NormalizeProvinceName(address.Province);
                if (!ValidProvinces.Contains(normalizedProvince))
                {
                    result.Errors.Add($"Tỉnh/Thành phố không hợp lệ: '{address.Province}' (normalized: '{normalizedProvince}')");
                    result.IsValid = false;
                }
            }

            // Validate district
            if (string.IsNullOrWhiteSpace(address.District))
            {
                result.Errors.Add("Quận/Huyện không được để trống");
                result.IsValid = false;
            }

            // Ward validation (optional but recommended)
            if (string.IsNullOrWhiteSpace(address.Ward))
            {
                result.Warnings.Add("Phường/Xã không được cung cấp - có thể ảnh hưởng đến việc giao hàng");
            }

            // Additional warnings
            if (address.FullName?.Length < 5)
            {
                result.Warnings.Add("Họ tên có vẻ quá ngắn");
            }

            if (address.AddressLine?.Length < 10)
            {
                result.Warnings.Add("Địa chỉ cụ thể có vẻ quá ngắn - hãy cung cấp đầy đủ số nhà, tên đường");
            }

            return result;
        }

        public static bool IsValidVietnamesePhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return false;

            return VietnamesePhoneRegex.IsMatch(phoneNumber.Trim());
        }

        public static bool IsValidProvince(string province)
        {
            if (string.IsNullOrWhiteSpace(province))
                return false;

            return ValidProvinces.Any(p => string.Equals(
                NormalizeVietnameseText(p), 
                NormalizeVietnameseText(province), 
                StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Enhanced address validation with fuzzy matching and encoding normalization
        /// Supports multiple validation strategies for Vietnamese addresses
        /// </summary>
        public static async Task<AddressValidationResult> ValidateAddressAsync(string province, string district = null, string ward = null)
        {
            var result = new AddressValidationResult { IsValid = false };

            try
            {
                if (string.IsNullOrWhiteSpace(province))
                {
                    result.ErrorMessage = "Province name is required";
                    return result;
                }

                // 🚀 STRATEGY 1: Normalize input text for consistent comparison
                var normalizedProvince = NormalizeVietnameseText(province);
                var normalizedDistrict = NormalizeVietnameseText(district ?? "");
                var normalizedWard = NormalizeVietnameseText(ward ?? "");

                // 🚀 STRATEGY 2: Exact match with normalized hardcoded list
                var exactMatch = ValidProvinces.Any(p => string.Equals(
                    NormalizeVietnameseText(p), 
                    normalizedProvince, 
                    StringComparison.OrdinalIgnoreCase));

                if (exactMatch)
                {
                    result.IsValid = true;
                    result.MatchedProvince = ValidProvinces.First(p => string.Equals(
                        NormalizeVietnameseText(p), 
                        normalizedProvince, 
                        StringComparison.OrdinalIgnoreCase));
                    result.ValidationStrategy = "ExactMatch";
                    return result;
                }

                // 🚀 STRATEGY 3: Fuzzy matching for typos and variations
                var fuzzyMatch = ValidProvinces.FirstOrDefault(p =>
                {
                    var normalizedValidProvince = NormalizeVietnameseText(p);
                    
                    // Check if normalized province contains the search term or vice versa
                    return normalizedValidProvince.Contains(normalizedProvince, StringComparison.OrdinalIgnoreCase) ||
                           normalizedProvince.Contains(normalizedValidProvince, StringComparison.OrdinalIgnoreCase);
                });

                if (fuzzyMatch != null)
                {
                    result.IsValid = true;
                    result.MatchedProvince = fuzzyMatch;
                    result.ValidationStrategy = "FuzzyMatch";
                    result.Suggestions = new[] { fuzzyMatch };
                    return result;
                }

                // 🚀 STRATEGY 4: Advanced similarity matching (optional - can be enabled later)
                // Uses Levenshtein distance or similar algorithms for very flexible matching

                // If no match found, provide suggestions
                result.Suggestions = ValidProvinces
                    .Where(p => NormalizeVietnameseText(p).Contains(normalizedProvince.Substring(0, Math.Min(3, normalizedProvince.Length)), StringComparison.OrdinalIgnoreCase))
                    .Take(3)
                    .ToArray();

                result.ErrorMessage = $"Province '{province}' not found. Did you mean: {string.Join(", ", result.Suggestions)}";
                
                return result;
            }
            catch (Exception ex)
            {
                result.ErrorMessage = $"Address validation error: {ex.Message}";
                return result;
            }
        }

        /// <summary>
        /// Normalize Vietnamese address text for consistent comparison
        /// Handles all common encoding and formatting issues
        /// </summary>
        private static string NormalizeVietnameseText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            // Remove extra whitespaces, normalize to single spaces
            var normalized = System.Text.RegularExpressions.Regex.Replace(text.Trim(), @"\s+", " ");
            
            // 🚀 COMPREHENSIVE UNICODE FIXES for Vietnamese
            normalized = normalized
                // Fix D variations (most common issue)
                .Replace("Ðịnh", "Định").Replace("ðịnh", "định")
                .Replace("Ð", "Đ").Replace("ð", "đ")
                .Replace("Đăk", "Đắk").Replace("đăk", "đắk")  // Đắk Lắk variations
                
                // Fix A variations
                .Replace("Ă", "Ă").Replace("ă", "ă")          // Normalize composed characters
                .Replace("Â", "Â").Replace("â", "â")
                .Replace("À", "À").Replace("à", "à")
                
                // Fix O variations  
                .Replace("Ô", "Ô").Replace("ô", "ô")
                .Replace("Ơ", "Ơ").Replace("ơ", "ơ")
                
                // Fix U variations
                .Replace("Ư", "Ư").Replace("ư", "ư")
                .Replace("Ủ", "Ủ").Replace("ủ", "ủ")
                
                // Fix tone marks that might be separate
                .Replace("́", "́").Replace("̀", "̀").Replace("̃", "̃")
                .Replace("̣", "̣").Replace("̉", "̉")
                
                // Remove common prefixes/suffixes
                .Replace("Tỉnh ", "").Replace("tỉnh ", "")
                .Replace("Thành phố ", "").Replace("thành phố ", "")
                .Replace("TP.", "").Replace("tp.", "").Replace("Tp.", "")
                .Replace("T.P.", "").Replace("t.p.", "")
                .Replace("Huyện ", "").Replace("huyện ", "")
                .Replace("Quận ", "").Replace("quận ", "")
                .Replace("Xã ", "").Replace("xã ", "")
                .Replace("Phường ", "").Replace("phường ", "")
                .Replace("Thị xã ", "").Replace("thị xã ", "")
                .Replace("Thị trấn ", "").Replace("thị trấn ", "")
                .Trim();

            // 🚀 Unicode normalization to canonical form
            normalized = normalized.Normalize(System.Text.NormalizationForm.FormC);
            
            // Remove any remaining double spaces
            normalized = System.Text.RegularExpressions.Regex.Replace(normalized, @"\s+", " ").Trim();

            return normalized;
        }

        /// <summary>
        /// Normalize province name for consistent comparison
        /// </summary>
        private static string NormalizeProvinceName(string province)
        {
            return NormalizeVietnameseText(province);
        }
    }
}
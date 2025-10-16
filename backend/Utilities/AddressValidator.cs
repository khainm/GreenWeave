using System.Text.RegularExpressions;
using backend.Models;

namespace backend.Utilities
{
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

        // List of valid Vietnamese provinces
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
            "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"
        };

        public class AddressValidationResult
        {
            public bool IsValid { get; set; }
            public List<string> Errors { get; set; } = new List<string>();
            public List<string> Warnings { get; set; } = new List<string>();
        }

        public static AddressValidationResult ValidateForShipping(UserAddress address)
        {
            var result = new AddressValidationResult { IsValid = true };

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

            return ValidProvinces.Contains(NormalizeProvinceName(province));
        }

        /// <summary>
        /// Normalize province name for consistent comparison
        /// </summary>
        private static string NormalizeProvinceName(string province)
        {
            if (string.IsNullOrWhiteSpace(province))
                return string.Empty;

            // Remove extra whitespaces, normalize to single spaces
            var normalized = System.Text.RegularExpressions.Regex.Replace(province.Trim(), @"\s+", " ");
            
            // Handle common variations
            normalized = normalized
                .Replace("TP.", "")
                .Replace("tp.", "")
                .Replace("Tp.", "")
                .Replace("T.P.", "")
                .Replace("t.p.", "")
                .Replace("Thành phố", "")
                .Replace("thành phố", "")
                .Replace("Tỉnh", "")
                .Replace("tỉnh", "")
                .Trim();

            return normalized;
        }
    }
}
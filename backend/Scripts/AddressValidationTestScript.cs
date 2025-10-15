// using System;
// using System.Threading.Tasks;
// using Microsoft.Extensions.DependencyInjection;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Logging;
// using backend.Services;
// using backend.Utilities;
// using backend.Interfaces.Services;

// namespace backend.Scripts
// {
//     /// <summary>
//     /// Test script to verify ViettelPost address compatibility with AddressValidator
//     /// </summary>
//     public class AddressValidationTestScript
//     {
//         private readonly ILogger<AddressValidationTestScript> _logger;
//         private readonly IViettelPostAddressService _addressService;

//         public AddressValidationTestScript(
//             ILogger<AddressValidationTestScript> logger,
//             IViettelPostAddressService addressService)
//         {
//             _logger = logger;
//             _addressService = addressService;
//         }

//         public async Task RunAsync()
//         {
//             _logger.LogInformation("=== Starting Address Validation Test ===");

//             try
//             {
//                 // Get ViettelPost provinces
//                 var response = await _addressService.GetProvincesAsync();
//                 if (!response.Success || response.Data == null)
//                 {
//                     _logger.LogError("Failed to get ViettelPost provinces: {Message}", response.Message);
//                     return;
//                 }

//                 _logger.LogInformation("Retrieved {Count} provinces from ViettelPost API", response.Data.Count);

//                 // Get AddressValidator provinces
//                 var validatorProvinces = GetAddressValidatorProvinces();
//                 _logger.LogInformation("AddressValidator has {Count} provinces", validatorProvinces.Count);

//                 // Compare the lists
//                 _logger.LogInformation("\n=== COMPARISON RESULTS ===");

//                 // Check ViettelPost provinces not in AddressValidator
//                 var missingInValidator = response.Data
//                     .Where(vp => !validatorProvinces.Any(ap => 
//                         string.Equals(ap, vp.Name, StringComparison.OrdinalIgnoreCase)))
//                     .ToList();

//                 if (missingInValidator.Any())
//                 {
//                     _logger.LogWarning("❌ ViettelPost provinces NOT in AddressValidator ({Count}):", missingInValidator.Count);
//                     foreach (var province in missingInValidator)
//                     {
//                         _logger.LogWarning("  - {Name} (ID: {Id})", province.Name, province.Id);
//                     }
//                 }

//                 // Check AddressValidator provinces not in ViettelPost
//                 var missingInViettel = validatorProvinces
//                     .Where(ap => !response.Data.Any(vp => 
//                         string.Equals(ap, vp.Name, StringComparison.OrdinalIgnoreCase)))
//                     .ToList();

//                 if (missingInViettel.Any())
//                 {
//                     _logger.LogWarning("❌ AddressValidator provinces NOT in ViettelPost ({Count}):", missingInViettel.Count);
//                     foreach (var province in missingInViettel)
//                     {
//                         _logger.LogWarning("  - {Name}", province);
//                     }
//                 }

//                 // Check exact matches
//                 var exactMatches = response.Data
//                     .Where(vp => validatorProvinces.Any(ap => 
//                         string.Equals(ap, vp.Name, StringComparison.OrdinalIgnoreCase)))
//                     .ToList();

//                 _logger.LogInformation("✅ Exact matches ({Count}):", exactMatches.Count);
//                 foreach (var match in exactMatches.Take(5)) // Show first 5
//                 {
//                     _logger.LogInformation("  - {Name} (ID: {Id})", match.Name, match.Id);
//                 }

//                 // Test some common provinces for address mapping
//                 await TestCommonProvinces();

//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error running address validation test");
//             }
//         }

//         private async Task TestCommonProvinces()
//         {
//             _logger.LogInformation("\n=== TESTING COMMON PROVINCES ===");
            
//             var testProvinces = new[]
//             {
//                 "Hồ Chí Minh",
//                 "Hà Nội", 
//                 "Đà Nẵng",
//                 "Bình Định",
//                 "An Giang",
//                 "Cần Thơ"
//             };

//             foreach (var provinceName in testProvinces)
//             {
//                 try
//                 {
//                     var response = await _addressService.GetProvincesAsync();
//                     if (response.Success && response.Data != null)
//                     {
//                         var found = response.Data.FirstOrDefault(p => 
//                             p.Name?.ToLower().Contains(provinceName.ToLower()) == true ||
//                             provinceName.ToLower().Contains(p.Name?.ToLower() ?? ""));

//                         if (found != null)
//                         {
//                             _logger.LogInformation("✅ '{ProvinceName}' -> '{ViettelName}' (ID: {Id})", 
//                                 provinceName, found.Name, found.Id);
//                         }
//                         else
//                         {
//                             _logger.LogWarning("❌ '{ProvinceName}' -> NOT FOUND", provinceName);
//                         }
//                     }
//                 }
//                 catch (Exception ex)
//                 {
//                     _logger.LogError(ex, "Error testing province: {ProvinceName}", provinceName);
//                 }
//             }
//         }

//         private static HashSet<string> GetAddressValidatorProvinces()
//         {
//             return new HashSet<string>(StringComparer.OrdinalIgnoreCase)
//             {
//                 "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh",
//                 "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau",
//                 "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp",
//                 "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang",
//                 "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu",
//                 "Lâm Đồng", "Lạng Sơn", "Lào Cai", "Long An", "Nam Định", "Nghệ An",
//                 "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam",
//                 "Quảng Ngãi", "Quảng Ninh", "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh",
//                 "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang",
//                 "Trà Vinh", "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái",
//                 "Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"
//             };
//         }
//     }
// }
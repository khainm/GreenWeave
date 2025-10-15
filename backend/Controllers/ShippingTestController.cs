using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using backend.Interfaces.Services;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = UserRoles.Admin + "," + UserRoles.Staff)]
    public class ShippingTestController : ControllerBase
    {
        private readonly IShippingService _shippingService;
        private readonly ILogger<ShippingTestController> _logger;

        public ShippingTestController(IShippingService shippingService, ILogger<ShippingTestController> logger)
        {
            _shippingService = shippingService;
            _logger = logger;
        }

        /// <summary>
        /// Test shipping calculation with real addresses
        /// </summary>
        [HttpPost("test-calculation")]
        public async Task<ActionResult> TestShippingCalculation([FromBody] TestShippingRequest request)
        {
            try
            {
                _logger.LogInformation("=== SHIPPING CALCULATION TEST ===");
                _logger.LogInformation("Testing address: {ToProvince}, {ToDistrict}, {ToWard}", 
                    request.ToAddress.Province, request.ToAddress.District, request.ToAddress.Ward);

                var shippingRequest = new CalculateEcommerceShippingFeeRequest
                {
                    ToAddress = new ShippingAddressDto
                    {
                        Name = request.ToAddress.Name,
                        Phone = request.ToAddress.Phone,
                        AddressDetail = request.ToAddress.AddressDetail,
                        Ward = request.ToAddress.Ward,
                        District = request.ToAddress.District,
                        Province = request.ToAddress.Province
                    },
                    Weight = request.Weight,
                    InsuranceValue = request.InsuranceValue,
                    CodAmount = request.CodAmount
                };

                var result = await _shippingService.GetEcommerceShippingOptionsAsync(shippingRequest);

                _logger.LogInformation("=== TEST RESULTS ===");
                _logger.LogInformation("Available options: {Count}", result.Options.Count);
                foreach (var option in result.Options)
                {
                    _logger.LogInformation("- {ServiceName}: {Fee} VND (Available: {IsAvailable})", 
                        option.ServiceName, option.Fee, option.IsAvailable);
                }

                return Ok(new 
                { 
                    success = true, 
                    message = "Test completed successfully",
                    data = result,
                    testDetails = new
                    {
                        inputAddress = request.ToAddress,
                        calculationParameters = new
                        {
                            weight = request.Weight,
                            insuranceValue = request.InsuranceValue,
                            codAmount = request.CodAmount
                        }
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during shipping calculation test");
                return BadRequest(new 
                { 
                    success = false, 
                    message = ex.Message,
                    error = ex.ToString()
                });
            }
        }

        /// <summary>
        /// Test multiple common Vietnamese addresses
        /// </summary>
        [HttpPost("test-common-addresses")]
        public async Task<ActionResult> TestCommonAddresses()
        {
            var testAddresses = new[]
            {
                new TestAddress
                {
                    Name = "Nguyễn Văn A",
                    Phone = "0901234567",
                    AddressDetail = "123 Nguyễn Trãi",
                    Ward = "Phường 1",
                    District = "Quận 1",
                    Province = "Hồ Chí Minh"
                },
                new TestAddress
                {
                    Name = "Trần Thị B",
                    Phone = "0987654321",
                    AddressDetail = "456 Hoàng Diệu",
                    Ward = "Phường Hải Châu 1",
                    District = "Quận Hải Châu",
                    Province = "Đà Nẵng"
                },
                new TestAddress
                {
                    Name = "Lê Văn C",
                    Phone = "0912345678",
                    AddressDetail = "789 Điện Biên Phủ",
                    Ward = "Phường Ba Đình",
                    District = "Quận Ba Đình",
                    Province = "Hà Nội"
                },
                new TestAddress
                {
                    Name = "Phạm Thị D",
                    Phone = "0976543210",
                    AddressDetail = "321 Lê Duẩn",
                    Ward = "Phường Đông Hương",
                    District = "Thành phố Đông Hà",
                    Province = "Quảng Trị"
                }
            };

            var results = new List<object>();

            foreach (var address in testAddresses)
            {
                try
                {
                    _logger.LogInformation("Testing address: {Province} - {District} - {Ward}", 
                        address.Province, address.District, address.Ward);

                    var request = new CalculateEcommerceShippingFeeRequest
                    {
                        ToAddress = new ShippingAddressDto
                        {
                            Name = address.Name,
                            Phone = address.Phone,
                            AddressDetail = address.AddressDetail,
                            Ward = address.Ward,
                            District = address.District,
                            Province = address.Province
                        },
                        Weight = 1000, // 1kg
                        InsuranceValue = 100000, // 100k VND
                        CodAmount = 0
                    };

                    var result = await _shippingService.GetEcommerceShippingOptionsAsync(request);
                    
                    results.Add(new
                    {
                        address,
                        success = true,
                        availableOptions = result.Options.Count,
                        fees = result.Options.Where(o => o.IsAvailable).Select(o => new { o.ServiceName, o.Fee }),
                        cheapestFee = result.Options.Where(o => o.IsAvailable).Any() 
                            ? result.Options.Where(o => o.IsAvailable).Min(o => o.Fee)
                            : 0
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error testing address: {Province} - {District}", 
                        address.Province, address.District);
                    
                    results.Add(new
                    {
                        address,
                        success = false,
                        error = ex.Message
                    });
                }
            }

            return Ok(new 
            { 
                success = true, 
                message = $"Tested {testAddresses.Length} addresses",
                results
            });
        }
    }

    public class TestShippingRequest
    {
        public TestAddress ToAddress { get; set; } = new();
        public int Weight { get; set; } = 1000; // grams
        public decimal InsuranceValue { get; set; } = 100000; // VND
        public decimal CodAmount { get; set; } = 0; // VND
    }

    public class TestAddress
    {
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string AddressDetail { get; set; } = string.Empty;
        public string Ward { get; set; } = string.Empty;
        public string District { get; set; } = string.Empty;
        public string Province { get; set; } = string.Empty;
    }
}
using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class WarehouseSelectionService : IWarehouseSelectionService
    {
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly IProductWarehouseStockRepository _productWarehouseStockRepository;
        private readonly ILogger<WarehouseSelectionService> _logger;

        public WarehouseSelectionService(
            IWarehouseRepository warehouseRepository,
            IProductWarehouseStockRepository productWarehouseStockRepository,
            ILogger<WarehouseSelectionService> logger)
        {
            _warehouseRepository = warehouseRepository;
            _productWarehouseStockRepository = productWarehouseStockRepository;
            _logger = logger;
        }

        public async Task<WarehouseSelectionResult?> SelectOptimalWarehouseAsync(
            List<CreateOrderItemDto> orderItems, 
            UserAddressDto shippingAddress)
        {
            try
            {
                _logger.LogInformation("Selecting optimal warehouse for order with {ItemCount} items", orderItems.Count);

                // Lấy tất cả kho
                var warehouses = await _warehouseRepository.GetAllAsync();
                if (!warehouses.Any())
                {
                    _logger.LogWarning("No warehouses available");
                    return null;
                }

                var warehouseResults = new List<WarehouseSelectionResult>();

                // Kiểm tra từng kho
                foreach (var warehouse in warehouses)
                {
                    var stockResult = await CheckStockAvailabilityAsync(warehouse.Id, orderItems);
                    
                    if (stockResult.IsAvailable)
                    {
                        var warehouseDto = new WarehouseDto
                        {
                            Id = warehouse.Id,
                            Name = warehouse.Name,
                            ProvinceName = warehouse.ProvinceName,
                            DistrictName = warehouse.DistrictName,
                            WardName = warehouse.WardName,
                            AddressDetail = warehouse.AddressDetail,
                            GroupAddressId = warehouse.GroupAddressId,
                            IsActive = warehouse.IsActive,
                            CreatedAt = warehouse.CreatedAt,
                            UpdatedAt = warehouse.UpdatedAt
                        };
                        
                        var distancePriority = CalculateDistancePriority(warehouseDto, shippingAddress);
                        
                        warehouseResults.Add(new WarehouseSelectionResult
                        {
                            WarehouseId = warehouse.Id,
                            WarehouseName = warehouse.Name,
                            GroupAddressId = warehouse.GroupAddressId?.ToString() ?? "",
                            DistancePriority = distancePriority,
                            StockChecks = stockResult.StockChecks
                        });
                    }
                }

                if (!warehouseResults.Any())
                {
                    _logger.LogWarning("No warehouse has sufficient stock for the order");
                    return null;
                }

                // Sắp xếp theo khoảng cách (ưu tiên kho gần nhất)
                var optimalWarehouse = warehouseResults
                    .OrderBy(w => w.DistancePriority)
                    .First();

                _logger.LogInformation("Selected warehouse: {WarehouseName} (ID: {WarehouseId}) with distance priority {Priority}", 
                    optimalWarehouse.WarehouseName, optimalWarehouse.WarehouseId, optimalWarehouse.DistancePriority);

                return optimalWarehouse;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error selecting optimal warehouse");
                return null;
            }
        }

        public async Task<StockAvailabilityResult> CheckStockAvailabilityAsync(
            Guid warehouseId, 
            List<CreateOrderItemDto> orderItems)
        {
            try
            {
                var stockChecks = new List<StockCheckResult>();
                var unavailableItems = new List<string>();

                foreach (var item in orderItems)
                {
                    var stock = await _productWarehouseStockRepository.GetByProductAndWarehouseAsync(
                        item.ProductId, warehouseId);

                    var availableStock = stock?.AvailableStock ?? 0;
                    
                    stockChecks.Add(new StockCheckResult
                    {
                        ProductId = item.ProductId,
                        ProductName = item.ProductName,
                        RequiredQuantity = item.Quantity,
                        AvailableStock = availableStock
                    });

                    if (availableStock < item.Quantity)
                    {
                        unavailableItems.Add($"{item.ProductName} (cần {item.Quantity}, có {availableStock})");
                    }
                }

                return new StockAvailabilityResult
                {
                    IsAvailable = !unavailableItems.Any(),
                    StockChecks = stockChecks,
                    UnavailableItems = unavailableItems
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking stock availability for warehouse {WarehouseId}", warehouseId);
                return new StockAvailabilityResult
                {
                    IsAvailable = false,
                    StockChecks = new List<StockCheckResult>(),
                    UnavailableItems = new List<string> { "Lỗi kiểm tra stock" }
                };
            }
        }

        public int CalculateDistancePriority(WarehouseDto warehouse, UserAddressDto shippingAddress)
        {
            try
            {
                // Logic đơn giản: ưu tiên theo tỉnh/thành phố
                // Nếu cùng tỉnh = ưu tiên cao (1)
                // Nếu khác tỉnh = ưu tiên thấp (2)
                
                if (string.Equals(warehouse.ProvinceName, shippingAddress.Province, StringComparison.OrdinalIgnoreCase))
                {
                    // Cùng tỉnh - ưu tiên cao
                    return 1;
                }
                else
                {
                    // Khác tỉnh - ưu tiên thấp
                    return 2;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating distance priority");
                return 999; // Ưu tiên thấp nhất nếu có lỗi
            }
        }
    }
}

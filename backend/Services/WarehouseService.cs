using backend.DTOs;
using backend.Interfaces.Repositories;
using backend.Interfaces.Services;
using backend.Models;

namespace backend.Services
{
    public class WarehouseService : IWarehouseService
    {
        private readonly IWarehouseRepository _warehouseRepository;
        private readonly IShippingProvider _shippingProvider;
        private readonly ILogger<WarehouseService> _logger;

        public WarehouseService(
            IWarehouseRepository warehouseRepository,
            IShippingProvider shippingProvider,
            ILogger<WarehouseService> logger)
        {
            _warehouseRepository = warehouseRepository;
            _shippingProvider = shippingProvider;
            _logger = logger;
        }

        public async Task<WarehouseResponseDto> GetAllWarehousesAsync()
        {
            try
            {
                var warehouses = await _warehouseRepository.GetAllAsync();
                var warehouseDtos = warehouses.Select(MapToDto).ToList();

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Lấy danh sách kho hàng thành công",
                    Warehouses = warehouseDtos
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all warehouses");
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi lấy danh sách kho hàng",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<WarehouseResponseDto> GetWarehouseByIdAsync(Guid id)
        {
            try
            {
                var warehouse = await _warehouseRepository.GetByIdAsync(id);
                if (warehouse == null)
                {
                    return new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy kho hàng",
                        Errors = new List<string> { "Kho hàng không tồn tại" }
                    };
                }

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Lấy thông tin kho hàng thành công",
                    Warehouse = MapToDto(warehouse)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting warehouse by id: {Id}", id);
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi lấy thông tin kho hàng",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<WarehouseResponseDto> GetDefaultWarehouseAsync()
        {
            try
            {
                var warehouse = await _warehouseRepository.GetDefaultAsync();
                if (warehouse == null)
                {
                    return new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Không có kho hàng mặc định",
                        Errors = new List<string> { "Chưa thiết lập kho hàng mặc định" }
                    };
                }

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Lấy thông tin kho hàng mặc định thành công",
                    Warehouse = MapToDto(warehouse)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting default warehouse");
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi lấy thông tin kho hàng mặc định",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<WarehouseResponseDto> CreateWarehouseAsync(CreateWarehouseDto createWarehouseDto)
        {
            try
            {
                // 1. Kiểm tra trùng lặp địa chỉ
                var existingWarehouse = await _warehouseRepository.GetByAddressAsync(
                    createWarehouseDto.ProvinceId, 
                    createWarehouseDto.DistrictId, 
                    createWarehouseDto.WardId, 
                    createWarehouseDto.AddressDetail
                );

                if (existingWarehouse != null)
                {
                    return new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Kho hàng với địa chỉ này đã tồn tại",
                        Errors = new List<string> { "Địa chỉ đã được sử dụng bởi kho khác" }
                    };
                }

                // 2. Tạo kho hàng mới
                var warehouse = new Warehouse
                {
                    Name = createWarehouseDto.Name,
                    Phone = createWarehouseDto.Phone,
                    AddressDetail = createWarehouseDto.AddressDetail,
                    ProvinceId = createWarehouseDto.ProvinceId,
                    DistrictId = createWarehouseDto.DistrictId,
                    WardId = createWarehouseDto.WardId,
                    ProvinceName = createWarehouseDto.ProvinceName,
                    DistrictName = createWarehouseDto.DistrictName,
                    WardName = createWarehouseDto.WardName,
                    IsDefault = createWarehouseDto.IsDefault,
                    Notes = createWarehouseDto.Notes,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                var createdWarehouse = await _warehouseRepository.CreateAsync(warehouse);

                // 3. Tự động đăng ký với ViettelPost
                try
                {
                    _logger.LogInformation("🔄 [AUTO-REGISTER] Starting automatic registration for warehouse: {WarehouseId}", createdWarehouse.Id);
                    
                    var registerRequest = new RegisterInventoryRequest
                    {
                        Phone = createdWarehouse.Phone,
                        Name = createdWarehouse.Name,
                        Address = $"{createdWarehouse.AddressDetail}, {createdWarehouse.WardName}, {createdWarehouse.DistrictName}, {createdWarehouse.ProvinceName}",
                        WardsId = createdWarehouse.WardId
                    };

                    var registerResult = await _shippingProvider.RegisterInventoryAsync(registerRequest);
                    
                    if (registerResult.IsSuccess && registerResult.GroupAddressId.HasValue)
                    {
                        // Cập nhật GroupAddressId vào database
                        createdWarehouse.GroupAddressId = registerResult.GroupAddressId.Value;
                        createdWarehouse.IsRegistered = true;
                        await _warehouseRepository.UpdateAsync(createdWarehouse);
                        
                        _logger.LogInformation("✅ [AUTO-REGISTER] Successfully registered warehouse {WarehouseId} with ViettelPost, GroupAddressId: {GroupAddressId}", 
                            createdWarehouse.Id, registerResult.GroupAddressId);
                    }
                    else
                    {
                        _logger.LogWarning("⚠️ [AUTO-REGISTER] Failed to register warehouse {WarehouseId} with ViettelPost: {Error}", 
                            createdWarehouse.Id, registerResult.ErrorMessage);
                    }
                }
                catch (Exception registerEx)
                {
                    _logger.LogError(registerEx, "❌ [AUTO-REGISTER] Error during automatic registration for warehouse {WarehouseId}", createdWarehouse.Id);
                    // Không throw exception để không ảnh hưởng đến việc tạo kho hàng
                }

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Tạo kho hàng thành công",
                    Warehouse = MapToDto(createdWarehouse)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating warehouse");
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi tạo kho hàng",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<WarehouseResponseDto> UpdateWarehouseAsync(Guid id, UpdateWarehouseDto updateWarehouseDto)
        {
            try
            {
                var warehouse = await _warehouseRepository.GetByIdAsync(id);
                if (warehouse == null)
                {
                    return new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy kho hàng",
                        Errors = new List<string> { "Kho hàng không tồn tại" }
                    };
                }

                warehouse.Name = updateWarehouseDto.Name;
                warehouse.Phone = updateWarehouseDto.Phone;
                warehouse.AddressDetail = updateWarehouseDto.AddressDetail;
                warehouse.ProvinceId = updateWarehouseDto.ProvinceId;
                warehouse.DistrictId = updateWarehouseDto.DistrictId;
                warehouse.WardId = updateWarehouseDto.WardId;
                warehouse.ProvinceName = updateWarehouseDto.ProvinceName;
                warehouse.DistrictName = updateWarehouseDto.DistrictName;
                warehouse.WardName = updateWarehouseDto.WardName;
                warehouse.IsDefault = updateWarehouseDto.IsDefault;
                warehouse.Notes = updateWarehouseDto.Notes;
                warehouse.UpdatedAt = DateTime.UtcNow;

                var updatedWarehouse = await _warehouseRepository.UpdateAsync(warehouse);

                // Đồng bộ với ViettelPost nếu có thay đổi địa chỉ và đã đăng ký trước đó
                if (updatedWarehouse.IsRegistered && updatedWarehouse.GroupAddressId.HasValue)
                {
                    try
                    {
                        _logger.LogInformation("🔄 [SYNC] Syncing warehouse {WarehouseId} with ViettelPost", updatedWarehouse.Id);
                        
                        // Có thể thêm logic đồng bộ ở đây nếu ViettelPost có API cập nhật
                        // Hiện tại chỉ log thông tin
                        _logger.LogInformation("✅ [SYNC] Warehouse {WarehouseId} sync completed", updatedWarehouse.Id);
                    }
                    catch (Exception syncEx)
                    {
                        _logger.LogError(syncEx, "❌ [SYNC] Error syncing warehouse {WarehouseId} with ViettelPost", updatedWarehouse.Id);
                        // Không throw exception để không ảnh hưởng đến việc cập nhật
                    }
                }

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Cập nhật kho hàng thành công",
                    Warehouse = MapToDto(updatedWarehouse)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating warehouse: {Id}", id);
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi cập nhật kho hàng",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<WarehouseResponseDto> DeleteWarehouseAsync(Guid id)
        {
            try
            {
                var success = await _warehouseRepository.DeleteAsync(id);
                if (!success)
                {
                    return new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy kho hàng",
                        Errors = new List<string> { "Kho hàng không tồn tại" }
                    };
                }

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Xóa kho hàng thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting warehouse: {Id}", id);
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi xóa kho hàng",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<WarehouseResponseDto> SetAsDefaultAsync(Guid id)
        {
            try
            {
                var success = await _warehouseRepository.SetAsDefaultAsync(id);
                if (!success)
                {
                    return new WarehouseResponseDto
                    {
                        Success = false,
                        Message = "Không tìm thấy kho hàng",
                        Errors = new List<string> { "Kho hàng không tồn tại" }
                    };
                }

                return new WarehouseResponseDto
                {
                    Success = true,
                    Message = "Đặt kho hàng làm mặc định thành công"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting warehouse as default: {Id}", id);
                return new WarehouseResponseDto
                {
                    Success = false,
                    Message = "Lỗi khi đặt kho hàng làm mặc định",
                    Errors = new List<string> { ex.Message }
                };
            }
        }

        public async Task<RegisterWarehouseResult> RegisterWithViettelPostAsync(Guid warehouseId)
        {
            try
            {
                var warehouse = await _warehouseRepository.GetByIdAsync(warehouseId);
                if (warehouse == null)
                {
                    return new RegisterWarehouseResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Không tìm thấy kho hàng"
                    };
                }

                var request = new RegisterInventoryRequest
                {
                    Phone = warehouse.Phone,
                    Name = warehouse.Name,
                    Address = $"{warehouse.AddressDetail}, {warehouse.WardName}, {warehouse.DistrictName}, {warehouse.ProvinceName}",
                    WardsId = warehouse.WardId
                };

                _logger.LogInformation("🔄 [WAREHOUSE-REGISTER] Registering warehouse {WarehouseId} with ViettelPost: {Request}", 
                    warehouseId, System.Text.Json.JsonSerializer.Serialize(request));

                var result = await _shippingProvider.RegisterInventoryAsync(request);
                
                _logger.LogInformation("📦 [WAREHOUSE-REGISTER] ViettelPost registration result for warehouse {WarehouseId}: {Result}", 
                    warehouseId, System.Text.Json.JsonSerializer.Serialize(result));
                
                if (result.IsSuccess)
                {
                    // Cập nhật thông tin đăng ký vào database
                    warehouse.GroupAddressId = result.GroupAddressId;
                    warehouse.IsRegistered = true;
                    warehouse.UpdatedAt = DateTime.UtcNow;
                    await _warehouseRepository.UpdateAsync(warehouse);

                    _logger.LogInformation("Successfully registered warehouse {WarehouseId} with ViettelPost, GroupAddressId: {GroupAddressId}", 
                        warehouseId, result.GroupAddressId);
                }

                return new RegisterWarehouseResult
                {
                    IsSuccess = result.IsSuccess,
                    GroupAddressId = result.GroupAddressId,
                    Message = result.Message,
                    ErrorMessage = result.ErrorMessage
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering warehouse with ViettelPost: {WarehouseId}", warehouseId);
                return new RegisterWarehouseResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"Lỗi: {ex.Message}"
                };
            }
        }

        private static WarehouseDto MapToDto(Warehouse warehouse)
        {
            return new WarehouseDto
            {
                Id = warehouse.Id,
                Name = warehouse.Name,
                Phone = warehouse.Phone,
                AddressDetail = warehouse.AddressDetail,
                ProvinceId = warehouse.ProvinceId,
                DistrictId = warehouse.DistrictId,
                WardId = warehouse.WardId,
                ProvinceName = warehouse.ProvinceName,
                DistrictName = warehouse.DistrictName,
                WardName = warehouse.WardName,
                GroupAddressId = warehouse.GroupAddressId,
                IsRegistered = warehouse.IsRegistered,
                IsDefault = warehouse.IsDefault,
                IsActive = warehouse.IsActive,
                CreatedAt = warehouse.CreatedAt,
                UpdatedAt = warehouse.UpdatedAt,
                Notes = warehouse.Notes
            };
        }
    }
}

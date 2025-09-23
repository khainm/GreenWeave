using backend.DTOs;

namespace backend.Interfaces.Services
{
    public interface IWarehouseService
    {
        Task<WarehouseResponseDto> GetAllWarehousesAsync();
        Task<WarehouseResponseDto> GetWarehouseByIdAsync(Guid id);
        Task<WarehouseResponseDto> GetDefaultWarehouseAsync();
        Task<WarehouseResponseDto> CreateWarehouseAsync(CreateWarehouseDto createWarehouseDto);
        Task<WarehouseResponseDto> UpdateWarehouseAsync(Guid id, UpdateWarehouseDto updateWarehouseDto);
        Task<WarehouseResponseDto> DeleteWarehouseAsync(Guid id);
        Task<WarehouseResponseDto> SetAsDefaultAsync(Guid id);
        Task<RegisterWarehouseResult> RegisterWithViettelPostAsync(Guid warehouseId);
    }
}
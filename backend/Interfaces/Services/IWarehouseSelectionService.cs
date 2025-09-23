using backend.DTOs;
using backend.Models;

namespace backend.Interfaces.Services
{
    public interface IWarehouseSelectionService
    {
        /// <summary>
        /// Tự động chọn kho phù hợp nhất cho đơn hàng
        /// </summary>
        /// <param name="orderItems">Danh sách sản phẩm trong đơn hàng</param>
        /// <param name="shippingAddress">Địa chỉ giao hàng</param>
        /// <returns>Warehouse phù hợp nhất hoặc null nếu không có kho nào đủ hàng</returns>
        Task<WarehouseSelectionResult?> SelectOptimalWarehouseAsync(
            List<CreateOrderItemDto> orderItems, 
            UserAddressDto shippingAddress);

        /// <summary>
        /// Kiểm tra kho có đủ hàng cho đơn hàng không
        /// </summary>
        /// <param name="warehouseId">ID kho</param>
        /// <param name="orderItems">Danh sách sản phẩm</param>
        /// <returns>Kết quả kiểm tra stock</returns>
        Task<StockAvailabilityResult> CheckStockAvailabilityAsync(
            Guid warehouseId, 
            List<CreateOrderItemDto> orderItems);

        /// <summary>
        /// Tính khoảng cách từ kho đến địa chỉ giao hàng (đơn giản)
        /// </summary>
        /// <param name="warehouse">Thông tin kho</param>
        /// <param name="shippingAddress">Địa chỉ giao hàng</param>
        /// <returns>Điểm ưu tiên (số càng thấp càng gần)</returns>
        int CalculateDistancePriority(WarehouseDto warehouse, UserAddressDto shippingAddress);
    }

    public class WarehouseSelectionResult
    {
        public Guid WarehouseId { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public string GroupAddressId { get; set; } = string.Empty;
        public int DistancePriority { get; set; }
        public List<StockCheckResult> StockChecks { get; set; } = new();
    }

    public class StockAvailabilityResult
    {
        public bool IsAvailable { get; set; }
        public List<StockCheckResult> StockChecks { get; set; } = new();
        public List<string> UnavailableItems { get; set; } = new();
    }

    public class StockCheckResult
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int RequiredQuantity { get; set; }
        public int AvailableStock { get; set; }
        public bool IsAvailable => AvailableStock >= RequiredQuantity;
    }
}

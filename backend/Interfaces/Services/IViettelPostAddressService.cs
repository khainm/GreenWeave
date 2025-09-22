using backend.DTOs;

namespace backend.Interfaces.Services
{
    /// <summary>
    /// Interface for Viettel Post address service
    /// </summary>
    public interface IViettelPostAddressService
    {
        /// <summary>
        /// Get list of provinces from Viettel Post API
        /// </summary>
        /// <returns>List of provinces</returns>
        Task<AddressApiResponse<List<AddressDto>>> GetProvincesAsync();

        /// <summary>
        /// Get list of districts by province ID from Viettel Post API
        /// </summary>
        /// <param name="provinceId">Province ID</param>
        /// <returns>List of districts</returns>
        Task<AddressApiResponse<List<AddressDto>>> GetDistrictsAsync(int provinceId);

        /// <summary>
        /// Get list of wards by district ID from Viettel Post API
        /// </summary>
        /// <param name="districtId">District ID</param>
        /// <returns>List of wards</returns>
        Task<AddressApiResponse<List<AddressDto>>> GetWardsAsync(int districtId);

        /// <summary>
        /// Get province with all districts and wards
        /// </summary>
        /// <param name="provinceId">Province ID</param>
        /// <returns>Province with districts and wards</returns>
        Task<AddressApiResponse<ProvinceWithDistrictsDto>> GetProvinceWithDistrictsAsync(int provinceId);

        /// <summary>
        /// Check if an address has any warnings
        /// </summary>
        /// <param name="wardId">Ward ID to check</param>
        /// <returns>Address warning result</returns>
        Task<AddressWarningResult> CheckAddressWarningAsync(int wardId);
    }
}

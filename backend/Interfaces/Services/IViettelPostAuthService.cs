namespace backend.Interfaces.Services
{
    public interface IViettelPostAuthService
    {
        /// <summary>
        /// Lấy token hợp lệ (tự động refresh nếu cần)
        /// </summary>
        /// <returns>Valid ViettelPost token</returns>
        Task<string> GetValidTokenAsync();
        
        /// <summary>
        /// Refresh token thủ công
        /// </summary>
        Task RefreshTokenAsync();
        
        /// <summary>
        /// Kiểm tra token có hợp lệ không
        /// </summary>
        /// <returns>True nếu token hợp lệ</returns>
        bool IsTokenValid();
    }
}
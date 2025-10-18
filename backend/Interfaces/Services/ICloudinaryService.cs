using CloudinaryDotNet.Actions;

namespace backend.Interfaces.Services
{
    public interface ICloudinaryService
    {
        // Existing methods (for backward compatibility)
        Task<ImageUploadResult> UploadImageAsync(IFormFile file, string folder = "products");
        Task<ImageUploadResult> UploadImageAsync(string imageUrl, string folder = "products");
        Task<DeletionResult> DeleteImageAsync(string publicId);
        
        // New methods for custom design feature
        Task<string> UploadDesignPreviewAsync(Stream imageStream, string fileName);
        Task<string> UploadUserImageAsync(Stream imageStream, string fileName);
        Task<bool> DeleteImageByPublicIdAsync(string publicId);
    }
}

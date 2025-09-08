using CloudinaryDotNet.Actions;

namespace backend.Interfaces.Services
{
    public interface ICloudinaryService
    {
        Task<ImageUploadResult> UploadImageAsync(IFormFile file, string folder = "products");
        Task<ImageUploadResult> UploadImageAsync(string imageUrl, string folder = "products");
        Task<DeletionResult> DeleteImageAsync(string publicId);
    }
}

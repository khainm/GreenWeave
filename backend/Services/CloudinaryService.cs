using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using backend.Interfaces.Services;

namespace backend.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly ILogger<CloudinaryService> _logger;
        
        public CloudinaryService(IConfiguration configuration, ILogger<CloudinaryService> logger)
        {
            var cloudName = configuration["Cloudinary:CloudName"];
            var apiKey = configuration["Cloudinary:ApiKey"];
            var apiSecret = configuration["Cloudinary:ApiSecret"];
            
            if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
            {
                throw new ArgumentException("Cloudinary configuration is missing");
            }
            
            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
            _logger = logger;
        }
        
        public async Task<ImageUploadResult> UploadImageAsync(IFormFile file, string folder = "products")
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is required");
                
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(file.FileName, file.OpenReadStream()),
                Folder = folder,
                Transformation = new Transformation()
                    .Quality("auto")
                    .FetchFormat("auto"),
                UseFilename = true,
                UniqueFilename = true
            };
            
            try
            {
                var result = await _cloudinary.UploadAsync(uploadParams);
                _logger.LogInformation("Image uploaded to Cloudinary: {PublicId}", result.PublicId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image to Cloudinary");
                throw;
            }
        }
        
        public async Task<ImageUploadResult> UploadImageAsync(string imageUrl, string folder = "products")
        {
            if (string.IsNullOrEmpty(imageUrl))
                throw new ArgumentException("Image URL is required");
                
            var uploadParams = new ImageUploadParams()
            {
                File = new FileDescription(imageUrl),
                Folder = folder,
                Transformation = new Transformation()
                    .Quality("auto")
                    .FetchFormat("auto"),
                UseFilename = true,
                UniqueFilename = true
            };
            
            try
            {
                var result = await _cloudinary.UploadAsync(uploadParams);
                _logger.LogInformation("Image uploaded to Cloudinary from URL: {PublicId}", result.PublicId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image from URL to Cloudinary");
                throw;
            }
        }
        
        public async Task<DeletionResult> DeleteImageAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId))
                throw new ArgumentException("Public ID is required");
                
            var deleteParams = new DeletionParams(publicId);
            
            try
            {
                var result = await _cloudinary.DestroyAsync(deleteParams);
                _logger.LogInformation("Image deleted from Cloudinary: {PublicId}", publicId);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image from Cloudinary: {PublicId}", publicId);
                throw;
            }
        }
    }
}

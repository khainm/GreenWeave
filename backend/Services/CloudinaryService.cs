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

        // ==================== NEW METHODS FOR CUSTOM DESIGN ====================
        
        /// <summary>
        /// Upload design preview image to Cloudinary (returns URL string)
        /// </summary>
        public async Task<string> UploadDesignPreviewAsync(Stream imageStream, string fileName)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, imageStream),
                Folder = "custom-designs/previews",
                Transformation = new Transformation()
                    .Width(1200).Height(1200).Crop("limit").Quality("auto"),
                UseFilename = true,
                UniqueFilename = true
            };

            var result = await _cloudinary.UploadAsync(uploadParams);
            
            if (result.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Error}", result.Error.Message);
                throw new Exception($"Image upload failed: {result.Error.Message}");
            }

            _logger.LogInformation("Design preview uploaded to Cloudinary: {PublicId}", result.PublicId);
            return result.SecureUrl.ToString();
        }

        /// <summary>
        /// Upload user-uploaded image to Cloudinary (returns URL string)
        /// </summary>
        public async Task<string> UploadUserImageAsync(Stream imageStream, string fileName)
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, imageStream),
                Folder = "custom-designs/user-images",
                Transformation = new Transformation()
                    .Width(800).Height(800).Crop("limit").Quality("auto"),
                UseFilename = true,
                UniqueFilename = true
            };

            var result = await _cloudinary.UploadAsync(uploadParams);
            
            if (result.Error != null)
            {
                _logger.LogError("Cloudinary upload error: {Error}", result.Error.Message);
                throw new Exception($"Image upload failed: {result.Error.Message}");
            }

            _logger.LogInformation("User image uploaded to Cloudinary: {PublicId}", result.PublicId);
            return result.SecureUrl.ToString();
        }

        /// <summary>
        /// Delete image from Cloudinary by public ID (returns bool)
        /// </summary>
        public async Task<bool> DeleteImageByPublicIdAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId))
                throw new ArgumentException("Public ID is required");
                
            var deleteParams = new DeletionParams(publicId);
            
            try
            {
                var result = await _cloudinary.DestroyAsync(deleteParams);
                _logger.LogInformation("Image deleted from Cloudinary: {PublicId}", publicId);
                return result.Result == "ok";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image from Cloudinary: {PublicId}", publicId);
                return false;
            }
        }

        // ==================== EXISTING METHODS (backward compatibility) ====================

        
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
        
        /// <summary>
        /// Delete image from Cloudinary (returns DeletionResult for backward compatibility)
        /// </summary>
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

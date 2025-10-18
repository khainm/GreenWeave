using System.IO;
using System.Threading.Tasks;

namespace backend.Services
{
    /// <summary>
    /// Service for generating AI-powered preview images using Google Gemini API
    /// </summary>
    public interface IGeminiPreviewService
    {
        /// <summary>
        /// Generate cartoon and cutout versions of the design
        /// </summary>
        /// <param name="imageStream">Canvas image stream</param>
        /// <param name="fileName">Original file name</param>
        /// <returns>URLs of cartoon and cutout versions</returns>
        Task<GeminiPreviewResult> GeneratePreviewAsync(Stream imageStream, string fileName);
    }

    public class GeminiPreviewResult
    {
        public string CartoonImageUrl { get; set; } = string.Empty;
        public string CutoutImageUrl { get; set; } = string.Empty;
        public string OriginalImageUrl { get; set; } = string.Empty;
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
    }
}

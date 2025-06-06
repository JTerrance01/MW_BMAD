using MixWarz.Domain.Interfaces;

namespace MixWarz.Application.Common.Utilities
{
    /// <summary>
    /// Utility class for handling file URL resolution consistently across the application.
    /// Handles both full URLs (from MockFileStorageService) and file paths (from S3FileStorageService).
    /// </summary>
    public static class FileUrlHelper
    {
        /// <summary>
        /// Resolves a file path or URL to a valid accessible URL.
        /// If the input is already a full URL, returns it directly.
        /// If the input is a file path, generates a pre-signed URL using the file storage service.
        /// For localhost development URLs, converts them to relative URLs for React proxy compatibility.
        /// </summary>
        /// <param name="fileStorageService">The file storage service to use for URL generation</param>
        /// <param name="filePathOrUrl">The file path or URL to resolve</param>
        /// <param name="expiry">The expiry time for generated URLs</param>
        /// <returns>A valid accessible URL</returns>
        public static async Task<string> ResolveFileUrlAsync(
            IFileStorageService fileStorageService,
            string filePathOrUrl,
            TimeSpan expiry)
        {
            // Check if the input is null or empty
            if (string.IsNullOrEmpty(filePathOrUrl))
                return filePathOrUrl;

            // Check if the input is already a relative URL from MockFileStorageService
            if (filePathOrUrl.StartsWith("/uploads/"))
            {
                // This is already a valid relative URL from MockFileStorageService, use it directly
                return filePathOrUrl;
            }

            // Check if the input is already a full URL
            if (Uri.TryCreate(filePathOrUrl, UriKind.Absolute, out var uri) &&
                (uri.Scheme == "http" || uri.Scheme == "https"))
            {
                // For localhost development URLs, convert to relative URLs for React proxy compatibility
                if (uri.Host == "localhost" && uri.Port == 7001)
                {
                    var relativePath = uri.PathAndQuery;
                    return relativePath;
                }

                // For other absolute URLs, use them directly
                return filePathOrUrl;
            }

            // It's a file path, generate a URL using the file storage service
            return await fileStorageService.GetFileUrlAsync(filePathOrUrl, expiry);
        }

        /// <summary>
        /// Checks if a string is a valid HTTP/HTTPS URL.
        /// </summary>
        /// <param name="input">The string to check</param>
        /// <returns>True if the input is a valid HTTP/HTTPS URL, false otherwise</returns>
        public static bool IsValidUrl(string input)
        {
            return Uri.TryCreate(input, UriKind.Absolute, out var uri) &&
                   (uri.Scheme == "http" || uri.Scheme == "https");
        }
    }
}
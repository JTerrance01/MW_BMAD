using MixWarz.Domain.Interfaces;
using System;
using System.Text.RegularExpressions;

namespace MixWarz.Application.Common.Utilities
{
    /// <summary>
    /// Utility class for handling file URL resolution consistently across the application.
    /// Handles both full URLs (from MockFileStorageService) and file paths (from S3FileStorageService).
    /// </summary>
    public static class FileUrlHelper
    {
        private const string DEFAULT_BASE_URL = "https://localhost:7001";
        private const string UPLOADS_PATH = "uploads";

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

        /// <summary>
        /// Processes a file URL to ensure it's in the correct format
        /// Handles both cleaning duplicate paths and ensuring absolute URL format
        /// </summary>
        /// <param name="url">The URL to process</param>
        /// <param name="baseUrl">The base URL to use (optional, defaults to https://localhost:7001)</param>
        /// <returns>A properly formatted absolute URL</returns>
        public static string ProcessFileUrl(string url, string? baseUrl = null)
        {
            if (string.IsNullOrEmpty(url))
                return url;

            // First, clean any duplicate path segments
            url = CleanDuplicatePaths(url);

            // Then ensure it's an absolute URL
            return EnsureAbsoluteUrl(url, baseUrl);
        }

        /// <summary>
        /// Ensures the URL is in absolute format
        /// </summary>
        /// <param name="url">The URL to process</param>
        /// <param name="baseUrl">The base URL to use (optional)</param>
        /// <returns>An absolute URL</returns>
        public static string EnsureAbsoluteUrl(string url, string? baseUrl = null)
        {
            if (string.IsNullOrEmpty(url))
                return url;

            // If already absolute, just clean it and return
            if (url.StartsWith("http://") || url.StartsWith("https://"))
            {
                return CleanDuplicatePaths(url);
            }

            // Use provided base URL or default
            var effectiveBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

            // Remove leading slash if present to avoid double slashes
            var cleanPath = url.StartsWith("/") ? url.Substring(1) : url;

            // Construct absolute URL
            var absoluteUrl = $"{effectiveBaseUrl}/{cleanPath}";

            // Clean any duplicate paths that might have been created
            return CleanDuplicatePaths(absoluteUrl);
        }

        /// <summary>
        /// Removes duplicate path segments from a URL
        /// For example: /uploads/uploads/file.mp3 becomes /uploads/file.mp3
        /// </summary>
        /// <param name="url">The URL to clean</param>
        /// <returns>URL with duplicate path segments removed</returns>
        public static string CleanDuplicatePaths(string url)
        {
            if (string.IsNullOrEmpty(url))
                return url;

            // Common duplicate patterns to fix
            var patterns = new[]
            {
                @"(/uploads/)+uploads/", // Matches /uploads/uploads/ or multiple uploads
                @"(\\uploads\\)+uploads\\", // Windows path version
                @"(/api/)+api/", // API duplicates
                @"(/v1/)+v1/", // Version duplicates
            };

            foreach (var pattern in patterns)
            {
                url = Regex.Replace(url, pattern, "$1", RegexOptions.IgnoreCase);
            }

            // Also handle the specific case of duplicate 'uploads' in the path
            url = url.Replace("/uploads/uploads/", "/uploads/");
            url = url.Replace("\\uploads\\uploads\\", "\\uploads\\");

            return url;
        }

        /// <summary>
        /// Extracts the relative path from an absolute URL
        /// </summary>
        /// <param name="absoluteUrl">The absolute URL</param>
        /// <returns>The relative path portion</returns>
        public static string GetRelativePath(string absoluteUrl)
        {
            if (string.IsNullOrEmpty(absoluteUrl))
                return absoluteUrl;

            // If it's not an absolute URL, it's already relative
            if (!absoluteUrl.StartsWith("http://") && !absoluteUrl.StartsWith("https://"))
                return absoluteUrl;

            // Parse the URL and extract the path portion
            try
            {
                var uri = new Uri(absoluteUrl);
                return uri.AbsolutePath;
            }
            catch
            {
                // If parsing fails, return the original
                return absoluteUrl;
            }
        }

        /// <summary>
        /// Ensures a file key doesn't have duplicate path prefixes
        /// Used when constructing file storage paths
        /// </summary>
        /// <param name="fileKey">The file key to process</param>
        /// <param name="expectedPrefix">The expected prefix (e.g., "uploads")</param>
        /// <returns>A properly formatted file key</returns>
        public static string EnsureProperFileKey(string fileKey, string expectedPrefix)
        {
            if (string.IsNullOrEmpty(fileKey))
                return fileKey;

            // Remove leading slashes
            fileKey = fileKey.TrimStart('/', '\\');

            // If the fileKey already starts with the expected prefix, don't add it again
            if (fileKey.StartsWith(expectedPrefix + "/", StringComparison.OrdinalIgnoreCase) ||
                fileKey.StartsWith(expectedPrefix + "\\", StringComparison.OrdinalIgnoreCase))
            {
                return fileKey;
            }

            // Otherwise, prepend the expected prefix
            return $"{expectedPrefix}/{fileKey}";
        }

        /// <summary>
        /// URL encodes the filename portion of a path while preserving the directory structure
        /// </summary>
        /// <param name="filePath">The file path to encode</param>
        /// <returns>Path with encoded filename</returns>
        public static string EncodeFilePath(string filePath)
        {
            if (string.IsNullOrEmpty(filePath))
                return filePath;

            // Split the path into directory and filename
            var lastSlashIndex = filePath.LastIndexOfAny(new[] { '/', '\\' });
            if (lastSlashIndex < 0)
            {
                // No directory, just encode the whole thing
                return Uri.EscapeDataString(filePath);
            }

            var directory = filePath.Substring(0, lastSlashIndex);
            var filename = filePath.Substring(lastSlashIndex + 1);

            // URL encode only the filename
            var encodedFilename = Uri.EscapeDataString(filename);

            // Reconstruct the path
            return $"{directory}/{encodedFilename}";
        }
    }
}
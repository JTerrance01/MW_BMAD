using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Interfaces;
using MixWarz.Application.Common.Utilities;

namespace MixWarz.Infrastructure.Services
{
    public class MockFileStorageService : IFileStorageService
    {
        private readonly string _baseFilePath;
        private readonly string _webRootPath;

        public MockFileStorageService()
        {
            // Use a more reliable path to a dedicated uploads directory outside of wwwroot
            // to avoid ASP.NET Core static web asset scanning issues during build
            var currentDirectory = Directory.GetCurrentDirectory();
            Console.WriteLine($"[MOCK] Current directory: {currentDirectory}");

            // Check if we're already in the API project directory
            if (currentDirectory.EndsWith("MixWarz.API"))
            {
                _webRootPath = Path.Combine(currentDirectory, "AppData", "uploads");
            }
            else
            {
                // If not, try to find the API project directory
                var apiProjectPath = Path.Combine(currentDirectory, "src", "MixWarz.API");
                if (Directory.Exists(apiProjectPath))
                {
                    _webRootPath = Path.Combine(apiProjectPath, "AppData", "uploads");
                }
                else
                {
                    // Fallback to current directory + AppData/uploads
                    _webRootPath = Path.Combine(currentDirectory, "AppData", "uploads");
                }
            }

            _baseFilePath = _webRootPath;
            Console.WriteLine($"[MOCK] Base file path: {_baseFilePath}");

            // Create the directory if it doesn't exist
            if (!Directory.Exists(_baseFilePath))
            {
                Directory.CreateDirectory(_baseFilePath);
                Console.WriteLine($"[MOCK] Created uploads directory at: {_baseFilePath}");
            }
            else
            {
                Console.WriteLine($"[MOCK] Using existing uploads directory at: {_baseFilePath}");
            }
        }

        public Task DeleteFileAsync(string fileKey)
        {
            Console.WriteLine($"[MOCK] Deleting file: {fileKey}");

            // Get the local path for the file
            string localPath = Path.Combine(_baseFilePath, fileKey.Replace('/', Path.DirectorySeparatorChar));

            // Delete the file if it exists
            if (File.Exists(localPath))
            {
                File.Delete(localPath);
                Console.WriteLine($"[MOCK] Deleted local file: {localPath}");
            }

            return Task.CompletedTask;
        }

        public Task<string> GetFileUrlAsync(string fileKey, TimeSpan expiry)
        {
            Console.WriteLine($"[MOCK] Getting URL for file: {fileKey} (expires in {expiry.TotalMinutes} minutes)");

            // URL encode the file key to handle filenames with spaces and special characters
            var encodedFileKey = EncodeFileKey(fileKey);

            // Use FileUrlHelper to ensure proper file key format
            encodedFileKey = FileUrlHelper.EnsureProperFileKey(encodedFileKey, "uploads");

            // Construct the URL
            var url = $"/{encodedFileKey}";

            // Clean any duplicate paths
            url = FileUrlHelper.CleanDuplicatePaths(url);

            Console.WriteLine($"[MOCK] Returning relative URL: {url}");

            return Task.FromResult(url);
        }

        public Task<string> GetPresignedUrlAsync(string fileKey)
        {
            Console.WriteLine($"[MOCK] Getting presigned URL for file: {fileKey}");

            // URL encode the file key to handle filenames with spaces and special characters
            var encodedFileKey = EncodeFileKey(fileKey);

            // Use FileUrlHelper to ensure proper file key format
            encodedFileKey = FileUrlHelper.EnsureProperFileKey(encodedFileKey, "uploads");

            // Construct the URL
            var url = $"/{encodedFileKey}";

            // Clean any duplicate paths
            url = FileUrlHelper.CleanDuplicatePaths(url);

            Console.WriteLine($"[MOCK] Returning relative presigned URL: {url}");

            return Task.FromResult(url);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string prefix = "uploads")
        {
            if (file == null)
            {
                Console.WriteLine("[MOCK] Error: Attempted to upload null file");
                throw new ArgumentNullException(nameof(file), "File cannot be null");
            }

            Console.WriteLine($"[MOCK] Uploading file: {file.FileName}, Size: {file.Length / 1024} KB, Content-Type: {file.ContentType}");

            try
            {
                // Create a mock file key with the original filename
                var fileName = $"{Guid.NewGuid()}-{file.FileName}";
                var fileKey = $"{prefix}/{fileName}";

                // Create directory for the prefix if it doesn't exist
                string prefixPath = Path.Combine(_baseFilePath, prefix);
                if (!Directory.Exists(prefixPath))
                {
                    Directory.CreateDirectory(prefixPath);
                    Console.WriteLine($"[MOCK] Created directory: {prefixPath}");
                }

                // Save the file to the uploads directory
                string filePath = Path.Combine(prefixPath, fileName);
                Console.WriteLine($"[MOCK] Saving file to: {filePath}");

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    // Add a slight delay to simulate network latency for larger files
                    if (file.Length > 1024 * 1024) // If file is larger than 1 MB
                    {
                        Console.WriteLine($"[MOCK] File is large ({file.Length / (1024 * 1024)} MB), simulating upload delay...");
                        int delayMs = (int)Math.Min(2000, file.Length / (1024 * 1024) * 100); // 100ms per MB up to 2 seconds
                        await Task.Delay(delayMs);
                    }

                    await file.CopyToAsync(stream);
                }

                // Return a relative URL instead of absolute URL for consistency with proxy setup
                var encodedFileKey = EncodeFileKey(fileKey);

                // Use FileUrlHelper to ensure proper format and no duplicate paths
                encodedFileKey = FileUrlHelper.EnsureProperFileKey(encodedFileKey, "uploads");
                var relativeUrl = $"/{encodedFileKey}";
                relativeUrl = FileUrlHelper.CleanDuplicatePaths(relativeUrl);

                Console.WriteLine($"[MOCK] Successfully uploaded file: {fileKey}");
                Console.WriteLine($"[MOCK] Returning relative URL: {relativeUrl}");
                return relativeUrl;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[MOCK] Error uploading file: {ex.Message}");
                Console.WriteLine($"[MOCK] Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        /// <summary>
        /// URL encodes the file key to handle filenames with spaces and special characters.
        /// This method encodes each segment of the path separately to preserve forward slashes.
        /// </summary>
        /// <param name="fileKey">The file key to encode</param>
        /// <returns>URL encoded file key</returns>
        private string EncodeFileKey(string fileKey)
        {
            if (string.IsNullOrEmpty(fileKey))
                return fileKey;

            // Split the fileKey by forward slash to handle path segments separately
            var segments = fileKey.Split('/');

            // URL encode each segment individually to preserve the path structure
            var encodedSegments = segments.Select(segment => Uri.EscapeDataString(segment));

            // Rejoin with forward slashes
            var encodedFileKey = string.Join("/", encodedSegments);

            Console.WriteLine($"[MOCK] Encoded file key '{fileKey}' -> '{encodedFileKey}'");
            return encodedFileKey;
        }
    }
}
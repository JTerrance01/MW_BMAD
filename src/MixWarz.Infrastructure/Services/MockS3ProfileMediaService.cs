using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MixWarz.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Services
{
    public class MockS3ProfileMediaService : IS3ProfileMediaService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly string _uploadsBasePath;
        private readonly string _profilePicturesFolder;
        private readonly string _galleryImagesFolder;
        private readonly string _audioFilesFolder;
        private readonly string _baseUrl;

        public MockS3ProfileMediaService(
            IConfiguration configuration,
            IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;

            // Get base path from configuration or use default
            _uploadsBasePath = configuration["Storage:LocalUploadsPath"]
                ?? Path.Combine(Directory.GetCurrentDirectory(), "AppData", "uploads");

            // Create base paths for storage
            _profilePicturesFolder = Path.Combine(_uploadsBasePath, "profile-pictures");
            _galleryImagesFolder = Path.Combine(_uploadsBasePath, "gallery-images");
            _audioFilesFolder = Path.Combine(_uploadsBasePath, "audio-files");

            // Ensure directories exist - log full paths for debugging
            Console.WriteLine($"Initializing MockS3ProfileMediaService with base path: {_uploadsBasePath}");
            EnsureDirectoryExists(_uploadsBasePath);
            EnsureDirectoryExists(_profilePicturesFolder);
            EnsureDirectoryExists(_galleryImagesFolder);
            EnsureDirectoryExists(_audioFilesFolder);

            // Set base URL
            _baseUrl = configuration["Storage:BaseUrl"] ?? "http://localhost:7001";

            Console.WriteLine($"MockS3ProfileMediaService initialized successfully:");
            Console.WriteLine($"- Base storage path: {_uploadsBasePath}");
            Console.WriteLine($"- Profile pictures: {_profilePicturesFolder}");
            Console.WriteLine($"- Gallery images: {_galleryImagesFolder}");
            Console.WriteLine($"- Audio files: {_audioFilesFolder}");
            Console.WriteLine($"- Base URL: {_baseUrl}");
        }

        // Get the virus scan service only when needed, using a new scope
        private IVirusScanService GetVirusScanService()
        {
            // Create a scope to resolve the scoped service
            using var scope = _serviceProvider.CreateScope();
            return scope.ServiceProvider.GetRequiredService<IVirusScanService>();
        }

        private void EnsureDirectoryExists(string path)
        {
            try
            {
                if (!Directory.Exists(path))
                {
                    Console.WriteLine($"Creating directory: {path}");
                    Directory.CreateDirectory(path);
                    Console.WriteLine($"Created directory successfully: {path}");

                    // Double check directory was actually created
                    if (!Directory.Exists(path))
                    {
                        throw new IOException($"Directory was not created despite no exception: {path}");
                    }
                }
                else
                {
                    Console.WriteLine($"Directory already exists: {path}");

                    // Verify directory is writable by creating a temp file
                    try
                    {
                        var testPath = Path.Combine(path, $"test_{Guid.NewGuid()}.tmp");
                        File.WriteAllText(testPath, "test");
                        File.Delete(testPath);
                        Console.WriteLine($"Directory is writable: {path}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"WARNING: Directory exists but may not be writable: {path}. Error: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR creating directory {path}: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                // Try to determine if this is a permissions issue
                if (ex is UnauthorizedAccessException)
                {
                    Console.WriteLine($"Permission denied. Ensure the application has write access to {path}");
                }

                throw new IOException($"Failed to create or access directory: {path}", ex);
            }
        }

        public async Task<bool> IsFileValid(IFormFile file, string contentType, long maxSizeBytes)
        {
            Console.WriteLine($"MockS3ProfileMediaService.IsFileValid: Validating file: {file?.FileName}, Size: {file?.Length}, Type: {file?.ContentType}");

            if (file == null || file.Length == 0 || file.Length > maxSizeBytes)
            {
                Console.WriteLine("MockS3ProfileMediaService.IsFileValid: File invalid - size constraints");
                return false;
            }

            // Check file content type
            if (!file.ContentType.StartsWith(contentType, StringComparison.OrdinalIgnoreCase))
            {
                Console.WriteLine("MockS3ProfileMediaService.IsFileValid: File invalid - content type");
                return false;
            }

            try
            {
                // Get the virus scan service only when needed
                var virusScanService = GetVirusScanService();

                // Perform virus scan
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;

                    // Call ScanAsync on the virus scan service
                    var scanResult = await virusScanService.ScanAsync(memoryStream);
                    Console.WriteLine($"MockS3ProfileMediaService.IsFileValid: Virus scan result: {scanResult}");

                    if (!scanResult)
                    {
                        Console.WriteLine("MockS3ProfileMediaService.IsFileValid: File failed virus scan");
                        return false;
                    }
                }

                Console.WriteLine("MockS3ProfileMediaService.IsFileValid: File is valid");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MockS3ProfileMediaService.IsFileValid: Error during validation: {ex.Message}");
                // In case of any error, reject the file
                return false;
            }
        }

        public async Task<string> UploadProfilePictureAsync(string userId, IFormFile file)
        {
            Console.WriteLine($"MockS3ProfileMediaService.UploadProfilePictureAsync: Uploading for user {userId}");
            return await SaveFileAsync(userId, file, _profilePicturesFolder, "profile");
        }

        public async Task<string> UploadGalleryImageAsync(string userId, IFormFile file)
        {
            Console.WriteLine($"MockS3ProfileMediaService.UploadGalleryImageAsync: Uploading for user {userId}");
            return await SaveFileAsync(userId, file, _galleryImagesFolder, "gallery");
        }

        public async Task<string> UploadAudioFileAsync(string userId, IFormFile file)
        {
            Console.WriteLine($"MockS3ProfileMediaService.UploadAudioFileAsync: Uploading for user {userId}");
            return await SaveFileAsync(userId, file, _audioFilesFolder, "audio");
        }

        private async Task<string> SaveFileAsync(string userId, IFormFile file, string folderPath, string prefix)
        {
            // Create user directory
            var userFolder = Path.Combine(folderPath, userId);

            try
            {
                Console.WriteLine($"Ensuring directory exists: {userFolder}");
                EnsureDirectoryExists(userFolder);

                // Generate unique filename with timestamp and guid to ensure uniqueness
                var fileName = $"{prefix}_{DateTime.UtcNow.Ticks}_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(userFolder, fileName);

                Console.WriteLine($"MockS3ProfileMediaService: Saving to {filePath}");

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Verify file was saved
                if (!File.Exists(filePath))
                {
                    throw new IOException($"File was not created at {filePath}");
                }

                Console.WriteLine($"File saved successfully to {filePath}");

                // Return relative path as "S3 key"
                var relativePath = GetRelativePath(filePath);
                Console.WriteLine($"MockS3ProfileMediaService: File saved, key: {relativePath}");
                return relativePath;
            }
            catch (IOException ioEx)
            {
                Console.WriteLine($"IO error saving file to {userFolder}: {ioEx.Message}");
                throw new IOException($"IO error saving file: {ioEx.Message}", ioEx);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving file to {userFolder}: {ex.Message}");
                throw new Exception($"Failed to save file: {ex.Message}", ex);
            }
        }

        private string GetRelativePath(string filePath)
        {
            // Calculate path relative to uploads folder
            var relativePath = filePath.Replace(_uploadsBasePath, "").Replace("\\", "/");
            if (relativePath.StartsWith("/"))
            {
                relativePath = relativePath.Substring(1);
            }
            return relativePath;
        }

        public async Task DeleteProfilePictureAsync(string s3Key)
        {
            Console.WriteLine($"MockS3ProfileMediaService.DeleteProfilePictureAsync: Deleting {s3Key}");
            DeleteFile(s3Key);
        }

        public async Task DeleteGalleryImageAsync(string s3Key)
        {
            Console.WriteLine($"MockS3ProfileMediaService.DeleteGalleryImageAsync: Deleting {s3Key}");
            DeleteFile(s3Key);
        }

        public async Task DeleteAudioFileAsync(string s3Key)
        {
            Console.WriteLine($"MockS3ProfileMediaService.DeleteAudioFileAsync: Deleting {s3Key}");
            DeleteFile(s3Key);
        }

        private void DeleteFile(string s3Key)
        {
            try
            {
                var filePath = Path.Combine(_uploadsBasePath, s3Key.Replace("/", "\\"));
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    Console.WriteLine($"MockS3ProfileMediaService: Deleted file {filePath}");
                }
                else
                {
                    Console.WriteLine($"MockS3ProfileMediaService: File not found {filePath}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"MockS3ProfileMediaService: Error deleting file - {ex.Message}");
            }
        }

        public string GetProfilePictureUrl(string s3Key)
        {
            return GetFileUrl(s3Key);
        }

        public string GetGalleryImageUrl(string s3Key)
        {
            return GetFileUrl(s3Key);
        }

        public string GetAudioFileUrl(string s3Key)
        {
            return GetFileUrl(s3Key);
        }

        private string GetFileUrl(string s3Key)
        {
            Console.WriteLine($"MockS3ProfileMediaService.GetFileUrl: Processing key: {s3Key}");

            // Handle null or empty keys
            if (string.IsNullOrEmpty(s3Key))
            {
                Console.WriteLine("WARNING: Empty S3 key provided to GetFileUrl");
                return string.Empty;
            }

            // Ensure the key doesn't start with a slash for URL combining
            s3Key = s3Key.TrimStart('/');

            // Check if s3Key already contains the uploads folder path
            if (!s3Key.StartsWith("uploads/"))
            {
                s3Key = $"uploads/{s3Key}";
            }

            // Combine with base URL, ensuring no double slashes
            string baseUrlTrimmed = _baseUrl.TrimEnd('/');
            string url = $"{baseUrlTrimmed}/{s3Key}";

            Console.WriteLine($"Generated URL: {url}");
            return url;
        }
    }
}
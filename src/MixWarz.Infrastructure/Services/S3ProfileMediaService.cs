using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using MixWarz.Application.Common.Interfaces;
using System;
using System.IO;
using System.Threading.Tasks;

namespace MixWarz.Infrastructure.Services
{
    public class S3ProfileMediaService : IS3ProfileMediaService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _profilePicturesBucket;
        private readonly string _galleryImagesBucket;
        private readonly string _audioFilesBucket;
        private readonly IVirusScanService _virusScanService;

        public S3ProfileMediaService(
            IAmazonS3 s3Client, 
            IConfiguration configuration,
            IVirusScanService virusScanService)
        {
            _s3Client = s3Client;
            _profilePicturesBucket = configuration["AWS:S3:UserProfilePicturesBucket"];
            _galleryImagesBucket = configuration["AWS:S3:UserGalleryImagesBucket"];
            _audioFilesBucket = configuration["AWS:S3:UserAudioFilesBucket"];
            
            // Add validation for configuration
            if (string.IsNullOrEmpty(_profilePicturesBucket))
            {
                _profilePicturesBucket = "user-profile-pictures";
                Console.WriteLine($"WARNING: AWS:S3:UserProfilePicturesBucket not configured. Using default: {_profilePicturesBucket}");
            }
            
            if (string.IsNullOrEmpty(_galleryImagesBucket))
            {
                _galleryImagesBucket = "user-gallery-images";
                Console.WriteLine($"WARNING: AWS:S3:UserGalleryImagesBucket not configured. Using default: {_galleryImagesBucket}");
            }
            
            if (string.IsNullOrEmpty(_audioFilesBucket))
            {
                _audioFilesBucket = "user-audio-files";
                Console.WriteLine($"WARNING: AWS:S3:UserAudioFilesBucket not configured. Using default: {_audioFilesBucket}");
            }
            
            _virusScanService = virusScanService;
            
            Console.WriteLine($"S3ProfileMediaService initialized with buckets: " +
                $"Profiles={_profilePicturesBucket}, Gallery={_galleryImagesBucket}, Audio={_audioFilesBucket}");
        }

        public async Task<bool> IsFileValid(IFormFile file, string contentType, long maxSizeBytes)
        {
            try
            {
                Console.WriteLine($"S3ProfileMediaService.IsFileValid: Validating file: {file?.FileName}, Size: {file?.Length}, Type: {file?.ContentType}");
                
                if (file == null || file.Length == 0 || file.Length > maxSizeBytes)
                {
                    Console.WriteLine("S3ProfileMediaService.IsFileValid: File invalid - size constraints");
                    return false;
                }

                // Check file content type
                if (!file.ContentType.StartsWith(contentType, StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("S3ProfileMediaService.IsFileValid: File invalid - content type");
                    return false;
                }

                // Scan for viruses
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    memoryStream.Position = 0;
                    
                    try
                    {
                        Console.WriteLine("S3ProfileMediaService.IsFileValid: Starting virus scan");
                        var scanResult = await _virusScanService.ScanAsync(memoryStream);
                        Console.WriteLine($"S3ProfileMediaService.IsFileValid: Virus scan completed with result: {scanResult}");
                        return scanResult;
                    }
                    catch (Exception scanEx)
                    {
                        Console.WriteLine($"S3ProfileMediaService.IsFileValid: Virus scan error: {scanEx.Message}");
                        // On error, reject the file for safety
                        return false;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"S3ProfileMediaService.IsFileValid: Validation error: {ex.Message}");
                return false;
            }
        }

        public async Task<string> UploadProfilePictureAsync(string userId, IFormFile file)
        {
            // Generate S3 key
            string fileExtension = Path.GetExtension(file.FileName);
            string s3Key = $"user-profiles/pictures/{userId}/profile_{DateTime.UtcNow.Ticks}{fileExtension}";

            // Upload to S3
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var request = new PutObjectRequest
                {
                    BucketName = _profilePicturesBucket,
                    Key = s3Key,
                    InputStream = memoryStream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
            }

            return s3Key;
        }

        public async Task<string> UploadGalleryImageAsync(string userId, IFormFile file)
        {
            // Generate S3 key
            string fileExtension = Path.GetExtension(file.FileName);
            string s3Key = $"user-profiles/gallery/{userId}/{DateTime.UtcNow.Ticks}_{Path.GetFileNameWithoutExtension(file.FileName)}{fileExtension}";

            // Upload to S3
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var request = new PutObjectRequest
                {
                    BucketName = _galleryImagesBucket,
                    Key = s3Key,
                    InputStream = memoryStream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
            }

            return s3Key;
        }

        public async Task<string> UploadAudioFileAsync(string userId, IFormFile file)
        {
            // Generate S3 key
            string fileExtension = Path.GetExtension(file.FileName);
            string s3Key = $"user-profiles/audio/{userId}/{DateTime.UtcNow.Ticks}_{Path.GetFileNameWithoutExtension(file.FileName)}{fileExtension}";

            // Upload to S3
            using (var memoryStream = new MemoryStream())
            {
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var request = new PutObjectRequest
                {
                    BucketName = _audioFilesBucket,
                    Key = s3Key,
                    InputStream = memoryStream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
            }

            return s3Key;
        }

        public async Task DeleteFileAsync(string bucket, string s3Key)
        {
            var request = new DeleteObjectRequest
            {
                BucketName = bucket,
                Key = s3Key
            };

            await _s3Client.DeleteObjectAsync(request);
        }

        public async Task DeleteProfilePictureAsync(string s3Key)
        {
            await DeleteFileAsync(_profilePicturesBucket, s3Key);
        }

        public async Task DeleteGalleryImageAsync(string s3Key)
        {
            await DeleteFileAsync(_galleryImagesBucket, s3Key);
        }

        public async Task DeleteAudioFileAsync(string s3Key)
        {
            await DeleteFileAsync(_audioFilesBucket, s3Key);
        }

        public string GetPresignedUrl(string bucket, string s3Key, DateTime expiryTime)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = bucket,
                Key = s3Key,
                Expires = expiryTime
            };

            return _s3Client.GetPreSignedURL(request);
        }

        public string GetProfilePictureUrl(string s3Key)
        {
            return GetPresignedUrl(_profilePicturesBucket, s3Key, DateTime.UtcNow.AddHours(1));
        }

        public string GetGalleryImageUrl(string s3Key)
        {
            return GetPresignedUrl(_galleryImagesBucket, s3Key, DateTime.UtcNow.AddHours(1));
        }

        public string GetAudioFileUrl(string s3Key)
        {
            return GetPresignedUrl(_audioFilesBucket, s3Key, DateTime.UtcNow.AddHours(1));
        }
    }
} 
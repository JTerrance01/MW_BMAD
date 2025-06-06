using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Services
{
    public class S3FileStorageService : IFileStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public S3FileStorageService(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _bucketName = configuration["AWS:S3:BucketName"];
        }

        public async Task<string> UploadFileAsync(IFormFile file, string directory)
        {
            // Generate a unique filename to avoid collisions
            var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
            var key = $"{directory}/{fileName}";

            using (var stream = file.OpenReadStream())
            {
                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = key,
                    InputStream = stream,
                    ContentType = file.ContentType
                };

                await _s3Client.PutObjectAsync(request);
            }

            return key;
        }

        public async Task<string> GetFileUrlAsync(string filePath, TimeSpan expiry)
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = filePath,
                Expires = DateTime.UtcNow.Add(expiry)
            };

            return await Task.FromResult(_s3Client.GetPreSignedURL(request));
        }

        public async Task DeleteFileAsync(string filePath)
        {
            var request = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = filePath
            };

            await _s3Client.DeleteObjectAsync(request);
        }
    }
} 
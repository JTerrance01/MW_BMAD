using Microsoft.AspNetCore.Http;

namespace MixWarz.Domain.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> UploadFileAsync(IFormFile file, string directory);
        Task<string> GetFileUrlAsync(string filePath, TimeSpan expiry);
        Task DeleteFileAsync(string filePath);
    }
} 
using Microsoft.AspNetCore.Http;
using System;
using System.Threading.Tasks;

namespace MixWarz.Application.Common.Interfaces
{
    public interface IS3ProfileMediaService
    {
        Task<bool> IsFileValid(IFormFile file, string contentType, long maxSizeBytes);
        
        // Profile Picture methods
        Task<string> UploadProfilePictureAsync(string userId, IFormFile file);
        Task DeleteProfilePictureAsync(string s3Key);
        string GetProfilePictureUrl(string s3Key);
        
        // Gallery Image methods
        Task<string> UploadGalleryImageAsync(string userId, IFormFile file);
        Task DeleteGalleryImageAsync(string s3Key);
        string GetGalleryImageUrl(string s3Key);
        
        // Audio File methods
        Task<string> UploadAudioFileAsync(string userId, IFormFile file);
        Task DeleteAudioFileAsync(string s3Key);
        string GetAudioFileUrl(string s3Key);
    }
} 
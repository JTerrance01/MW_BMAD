using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateProfilePicture
{
    public class UpdateProfilePictureCommandHandler : IRequestHandler<UpdateProfilePictureCommand, UpdateProfilePictureResponse>
    {
        private readonly IAppDbContext _dbContext;
        private readonly IS3ProfileMediaService _s3ProfileMediaService;
        
        private const long MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        private const string ALLOWED_CONTENT_TYPE = "image/";

        public UpdateProfilePictureCommandHandler(
            IAppDbContext dbContext,
            IS3ProfileMediaService s3ProfileMediaService)
        {
            _dbContext = dbContext;
            _s3ProfileMediaService = s3ProfileMediaService;
        }

        public async Task<UpdateProfilePictureResponse> Handle(UpdateProfilePictureCommand request, CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Processing request for user {request.UserId}");
                
                // Validate request
                if (request.ProfilePicture == null)
                {
                    Console.WriteLine("UpdateProfilePictureCommandHandler.Handle: Profile picture is null");
                    return new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "No profile picture was provided."
                    };
                }
            
                // Find the user
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
                
                if (user == null)
                {
                    Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: User {request.UserId} not found");
                    return new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "User not found."
                    };
                }
                
                Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: User {user.UserName} found");

                // Validate the uploaded file
                Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Validating file: Size={request.ProfilePicture.Length}, ContentType={request.ProfilePicture.ContentType}");
                var isValid = await _s3ProfileMediaService.IsFileValid(request.ProfilePicture, ALLOWED_CONTENT_TYPE, MAX_FILE_SIZE);
                
                if (!isValid)
                {
                    Console.WriteLine("UpdateProfilePictureCommandHandler.Handle: File validation failed");
                    return new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "Invalid file. Make sure the file is an image (JPEG, PNG) and less than 2MB."
                    };
                }
                
                Console.WriteLine("UpdateProfilePictureCommandHandler.Handle: File validation passed");

                // If user already has a profile picture, delete the old one
                if (!string.IsNullOrEmpty(user.ProfilePictureUrl))
                {
                    Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Deleting old profile picture: {user.ProfilePictureUrl}");
                    try
                    {
                        // Extract the S3 key from the URL if needed
                        string oldS3Key = user.ProfilePictureUrl;
                        
                        // If it's a URL, extract the relative path
                        if (oldS3Key.StartsWith("http"))
                        {
                            // Find the uploads/ part in the URL
                            int uploadsIndex = oldS3Key.IndexOf("/uploads/");
                            if (uploadsIndex >= 0)
                            {
                                oldS3Key = oldS3Key.Substring(uploadsIndex + 1); // +1 to remove the leading slash
                                Console.WriteLine($"Extracted S3 key from URL: {oldS3Key}");
                            }
                        }
                        
                        await _s3ProfileMediaService.DeleteProfilePictureAsync(oldS3Key);
                    }
                    catch (Exception ex)
                    {
                        // Log but continue - don't fail if delete fails
                        Console.WriteLine($"Warning: Failed to delete old profile picture: {ex.Message}");
                    }
                }

                // Upload the new profile picture
                Console.WriteLine("UpdateProfilePictureCommandHandler.Handle: Uploading new profile picture");
                string s3Key;
                try
                {
                    s3Key = await _s3ProfileMediaService.UploadProfilePictureAsync(request.UserId, request.ProfilePicture);
                    Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Upload successful, S3 key: {s3Key}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Upload failed: {ex.Message}");
                    return new UpdateProfilePictureResponse
                    {
                        Success = false,
                        Message = "Failed to upload profile picture: " + ex.Message
                    };
                }

                // Get the URL for the profile picture
                string profilePictureUrl;
                try
                {
                    profilePictureUrl = _s3ProfileMediaService.GetProfilePictureUrl(s3Key);
                    Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Got URL: {profilePictureUrl}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: Failed to get URL: {ex.Message}");
                    profilePictureUrl = s3Key; // Fallback to just using the key
                }

                // Update user entity with the URL, not the S3 key
                user.ProfilePictureUrl = profilePictureUrl;
                await _dbContext.SaveChangesAsync(cancellationToken);
                Console.WriteLine($"UpdateProfilePictureCommandHandler.Handle: User entity updated with URL: {profilePictureUrl}");

                return new UpdateProfilePictureResponse
                {
                    Success = true,
                    Message = "Profile picture updated successfully.",
                    ProfilePictureUrl = profilePictureUrl
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateProfilePictureCommandHandler.Handle: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                return new UpdateProfilePictureResponse
                {
                    Success = false,
                    Message = "An unexpected error occurred: " + ex.Message
                };
            }
        }
    }
} 
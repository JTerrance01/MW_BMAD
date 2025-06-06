using MediatR;
using Microsoft.EntityFrameworkCore;
using MixWarz.Application.Common.Interfaces;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.UserProfile.Commands.UpdateBio
{
    public class UpdateUserBioCommandHandler : IRequestHandler<UpdateUserBioCommand, UpdateUserBioResponse>
    {
        private readonly IAppDbContext _dbContext;
        private const int MAX_BIO_LENGTH = 500;

        public UpdateUserBioCommandHandler(IAppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<UpdateUserBioResponse> Handle(UpdateUserBioCommand request, CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine($"UpdateUserBioCommandHandler.Handle: Processing bio update for user {request.UserId}");
                Console.WriteLine($"Bio text length: {request.Bio?.Length ?? 0} characters");
                
                // Validate request
                if (request.UserId == null)
                {
                    Console.WriteLine("UpdateUserBioCommandHandler.Handle: User ID is null");
                    return new UpdateUserBioResponse
                    {
                        Success = false,
                        Message = "User ID is required."
                    };
                }

                // Validate bio is not null
                if (request.Bio == null)
                {
                    request.Bio = string.Empty; // Set to empty string if null
                    Console.WriteLine("UpdateUserBioCommandHandler.Handle: Bio was null, setting to empty string");
                }
                
                // Validate bio length
                if (request.Bio.Length > MAX_BIO_LENGTH)
                {
                    Console.WriteLine($"UpdateUserBioCommandHandler.Handle: Bio too long ({request.Bio.Length} characters)");
                    return new UpdateUserBioResponse
                    {
                        Success = false,
                        Message = $"Bio cannot exceed {MAX_BIO_LENGTH} characters."
                    };
                }

                // Find the user
                Console.WriteLine($"UpdateUserBioCommandHandler.Handle: Finding user with ID {request.UserId}");
                var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
                
                if (user == null)
                {
                    Console.WriteLine($"UpdateUserBioCommandHandler.Handle: User {request.UserId} not found");
                    return new UpdateUserBioResponse
                    {
                        Success = false,
                        Message = "User not found."
                    };
                }
                
                Console.WriteLine($"UpdateUserBioCommandHandler.Handle: Found user {user.UserName}");

                // Update the bio
                Console.WriteLine($"UpdateUserBioCommandHandler.Handle: Updating bio from '{user.Bio}' to '{request.Bio}'");
                user.Bio = request.Bio;
                
                try
                {
                    await _dbContext.SaveChangesAsync(cancellationToken);
                    Console.WriteLine("UpdateUserBioCommandHandler.Handle: Bio update saved successfully");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"UpdateUserBioCommandHandler.Handle: Database error: {ex.Message}");
                    return new UpdateUserBioResponse
                    {
                        Success = false,
                        Message = "Failed to save bio change to database."
                    };
                }

                return new UpdateUserBioResponse
                {
                    Success = true,
                    Message = "Bio updated successfully.",
                    Bio = user.Bio
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception in UpdateUserBioCommandHandler.Handle: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                
                return new UpdateUserBioResponse
                {
                    Success = false,
                    Message = "An unexpected error occurred: " + ex.Message
                };
            }
        }
    }
} 
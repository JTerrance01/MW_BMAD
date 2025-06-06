using Microsoft.AspNetCore.Identity;
using MixWarz.Domain.Entities;
using MixWarz.Domain.Interfaces;

namespace MixWarz.Infrastructure.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<User> _userManager;
        private readonly AppDbContext _context;
        
        public UserRepository(UserManager<User> userManager, AppDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }
        
        public async Task<User> GetByIdAsync(string id)
        {
            return await _userManager.FindByIdAsync(id);
        }
        
        public async Task<User> GetByUsernameAsync(string username)
        {
            return await _userManager.FindByNameAsync(username);
        }
        
        public async Task<User> GetByEmailAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email);
        }
        
        public async Task<bool> UsernameExistsAsync(string username)
        {
            return await _userManager.FindByNameAsync(username) != null;
        }
        
        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email) != null;
        }
        
        public async Task<bool> CreateUserAsync(User user, string password, string role)
        {
            user.RegistrationDate = DateTime.UtcNow;
            
            var result = await _userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await _userManager.AddToRoleAsync(user, role);
                return true;
            }
            
            // Log the errors
            foreach (var error in result.Errors)
            {
                Console.WriteLine($"User creation error: {error.Code} - {error.Description}");
            }
            
            return false;
        }
        
        public async Task UpdateUserAsync(User user)
        {
            await _userManager.UpdateAsync(user);
        }
    }
} 
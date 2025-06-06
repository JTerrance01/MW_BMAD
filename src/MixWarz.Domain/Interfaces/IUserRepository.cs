using MixWarz.Domain.Entities;

namespace MixWarz.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetByIdAsync(string id);
        Task<User> GetByUsernameAsync(string username);
        Task<User> GetByEmailAsync(string email);
        Task<bool> UsernameExistsAsync(string username);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> CreateUserAsync(User user, string password, string role);
        Task UpdateUserAsync(User user);
    }
} 
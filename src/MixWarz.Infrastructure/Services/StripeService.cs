using Microsoft.Extensions.Configuration;
using Stripe;

namespace MixWarz.Infrastructure.Services
{
    public interface IStripeService
    {
        // Define methods here if needed later
    }

    public class StripeService : IStripeService
    {
        private readonly string _secretKey;

        public StripeService(IConfiguration configuration)
        {
            _secretKey = configuration["Stripe:SecretKey"];
            StripeConfiguration.ApiKey = _secretKey;
            // It's good practice to set the API version if your integration relies on a specific one.
            // StripeConfiguration.ApiVersion = "2022-11-15"; // Example version, update as needed
        }

        // Implement Stripe-related methods here
    }
}
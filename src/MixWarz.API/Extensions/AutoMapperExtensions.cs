using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Reflection;

namespace MixWarz.API.Extensions
{
    public static class AutoMapperExtensions
    {
        public static IServiceCollection AddApplicationAutoMapper(this IServiceCollection services)
        {
            // Register AutoMapper and scan all assemblies for mapping profiles
            services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
            
            return services;
        }
        
        public static void ValidateAutoMapperConfiguration(this IServiceProvider serviceProvider)
        {
            var mapper = serviceProvider.GetRequiredService<IMapper>();
            try
            {
                mapper.ConfigurationProvider.AssertConfigurationIsValid();
                Console.WriteLine("✅ AutoMapper configuration is valid");
            }
            catch (AutoMapperConfigurationException ex)
            {
                Console.WriteLine("❌ AutoMapper configuration is invalid!");
                Console.WriteLine($"Error: {ex.Message}");
            }
        }
    }
} 
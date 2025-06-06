using AutoMapper;
using System;
using System.Linq;
using System.Text;

namespace MixWarz.API.Helpers
{
    public static class ValidateMappings
    {
        public static string ValidateWithDetails(AutoMapper.IConfigurationProvider config)
        {
            try
            {
                config.AssertConfigurationIsValid();
                return "All mappings are valid.";
            }
            catch (AutoMapperConfigurationException ex)
            {
                var sb = new StringBuilder();
                sb.AppendLine("AutoMapper configuration is invalid!");
                
                // Simplify the error extraction - just report the message
                sb.AppendLine("Error details:");
                sb.AppendLine(ex.Message);

                return sb.ToString();
            }
        }
    }
} 
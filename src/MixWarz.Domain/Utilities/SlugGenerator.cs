using System;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace MixWarz.Domain.Utilities
{
    public static class SlugGenerator
    {
        public static string GenerateSlug(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;
            
            // Remove diacritics (accents)
            var normalizedString = text.Normalize(NormalizationForm.FormD);
            var stringBuilder = new StringBuilder();
            
            foreach (var c in normalizedString)
            {
                var unicodeCategory = CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }
            
            // Convert to lowercase
            var slug = stringBuilder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
            
            // Remove special characters
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            
            // Convert spaces to hyphens and trim hyphens
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            slug = slug.Trim('-');
            
            return slug;
        }
        
        public static string EnsureUniqueSlug(string slug, Func<string, bool> isSlugExists)
        {
            if (!isSlugExists(slug))
                return slug;
            
            var uniqueSlug = slug;
            var counter = 1;
            
            while (isSlugExists(uniqueSlug))
            {
                uniqueSlug = $"{slug}-{counter}";
                counter++;
            }
            
            return uniqueSlug;
        }
    }
} 
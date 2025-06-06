using System.IO;
using System.Threading.Tasks;

namespace MixWarz.Application.Common.Interfaces
{
    public interface IVirusScanService
    {
        Task<bool> ScanAsync(Stream fileStream);
    }
} 
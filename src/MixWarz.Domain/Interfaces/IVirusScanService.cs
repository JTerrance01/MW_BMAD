using System.IO;
using System.Threading.Tasks;

namespace MixWarz.Domain.Interfaces
{
    public interface IVirusScanService
    {
        Task<bool> ScanAsync(Stream fileStream);

        Task<bool> ScanFileAsync(Stream fileStream);
    }
}
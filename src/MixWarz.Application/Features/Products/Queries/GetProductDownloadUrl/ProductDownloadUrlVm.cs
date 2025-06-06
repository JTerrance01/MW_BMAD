namespace MixWarz.Application.Features.Products.Queries.GetProductDownloadUrl
{
    public class ProductDownloadUrlVm
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public string DownloadUrl { get; set; }
        public string FileName { get; set; }
    }
} 
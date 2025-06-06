namespace MixWarz.Application.Features.Admin.Queries.GetOrdersList
{
    public class OrderDetailVm
    {
        public int OrderId { get; set; }
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerEmail { get; set; }
        public string? BillingAddress { get; set; }
        public List<OrderItemDto> Items { get; set; } = new();
    }
}

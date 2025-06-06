using System;
using System.Collections.Generic;

namespace MixWarz.Application.Features.Cart.DTOs
{
    public class CartDto
    {
        public int CartId { get; set; }
        public string UserId { get; set; }
        public DateTime LastModifiedDate { get; set; }
        public decimal TotalPrice { get; set; }
        public int TotalItems { get; set; }
        public List<CartItemDto> Items { get; set; } = new List<CartItemDto>();
    }
} 
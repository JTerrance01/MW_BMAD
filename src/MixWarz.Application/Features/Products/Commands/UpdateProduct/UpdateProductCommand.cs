using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Http;
using MixWarz.Domain.Enums;

namespace MixWarz.Application.Features.Products.Commands.UpdateProduct
{
    public class UpdateProductCommand : IRequest<UpdateProductResponse>
    {
        public int ProductId { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public ProductType? ProductType { get; set; }
        public string? DownloadFileS3Key { get; set; }
        public int? CategoryId { get; set; }
        public bool? IsActive { get; set; }
        public int? GenreId { get; set; }
        public string? StripeProductId { get; set; }
        public string? StripePriceId { get; set; }
        public ProductStatus? Status { get; set; }
        public IFormFile? ImageFile { get; set; }
        public IFormFile? DownloadFile { get; set; }
        public bool UpdateImage { get; set; }
        public bool UpdateDownloadFile { get; set; }
    }

    public class UpdateProductCommandValidator : AbstractValidator<UpdateProductCommand>
    {
        public UpdateProductCommandValidator()
        {
            RuleFor(p => p.ProductId)
                .NotEmpty().WithMessage("Product ID is required");

            RuleFor(p => p.Name)
                .NotEmpty().WithMessage("Product name is required")
                .MaximumLength(200).WithMessage("Product name must not exceed 200 characters");

            RuleFor(p => p.Description)
                .NotEmpty().WithMessage("Description is required");

            RuleFor(p => p.Price)
                .NotEmpty().WithMessage("Price is required")
                .GreaterThan(0).WithMessage("Price must be greater than zero");

            RuleFor(p => p.CategoryId)
                .NotEmpty().WithMessage("Category is required");

            RuleFor(p => p.ProductType)
                .IsInEnum().WithMessage("Valid product type is required");

            RuleFor(p => p.DownloadFile)
                .NotNull().WithMessage("Digital product file is required")
                .When(p => p.UpdateDownloadFile);
        }
    }
}
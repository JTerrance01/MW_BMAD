using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using MixWarz.Application.Features.Products.Commands.CreateProduct;
using MixWarz.Application.Features.Products.Commands.UpdateProduct;
using MixWarz.Application.Features.Products.Queries.GetProductsList;
using MixWarz.Application.Features.Products.Queries.GetProductDetail;
using MixWarz.Application.Features.Products.Queries.GetCategories;
using MixWarz.Application.Features.Products.Queries.GetProductDownloadUrl;
using System.Security.Claims;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ProductsController(IMediator mediator)
        {
            _mediator = mediator;
        }

        // GET api/v1/products
        [HttpGet]
        public async Task<ActionResult<ProductsListVm>> GetProducts(
            [FromQuery] int? categoryId = null,
            [FromQuery] bool? featured = null,
            [FromQuery] bool? isActive = true,
            [FromQuery] string? searchTerm = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                Console.WriteLine($"GetProducts called with categoryId={categoryId}, featured={featured}, isActive={isActive}, searchTerm={searchTerm}, page={page}, pageSize={pageSize}");

                // Create the query with explicit parameters
                var query = new GetProductsListQuery
                {
                    CategoryId = categoryId,
                    SearchTerm = searchTerm ?? "",
                    Page = page,
                    PageSize = pageSize,
                    IsActive = isActive,
                    AdminView = false // Public view only shows active products
                };

                Console.WriteLine($"Executing query with IsActive={query.IsActive}, CategoryId={query.CategoryId}, Page={query.Page}, PageSize={query.PageSize}");

                var result = await _mediator.Send(query);

                Console.WriteLine($"Query executed successfully. Retrieved {result.Products?.Count() ?? 0} products out of {result.TotalCount} total");

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ERROR in GetProducts: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");

                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"Inner exception stack trace: {ex.InnerException.StackTrace}");
                }

                return StatusCode(500, new { message = $"An error occurred while retrieving products: {ex.Message}" });
            }
        }

        // GET api/v1/products/admin
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductsListVm>> GetAdminProducts(
            [FromQuery] int? categoryId = null,
            [FromQuery] string? searchTerm = "",
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = new GetProductsListQuery
            {
                CategoryId = categoryId,
                SearchTerm = searchTerm ?? "",
                Page = page,
                PageSize = pageSize,
                AdminView = true // Admin view shows all products, including inactive
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        // GET api/v1/products/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDetailVm>> GetProductDetail(int id)
        {
            var query = new GetProductDetailQuery { ProductId = id };
            var result = await _mediator.Send(query);

            if (!result.Success)
            {
                return NotFound(result);
            }

            return Ok(result);
        }

        // GET api/v1/products/categories
        [HttpGet("categories")]
        public async Task<ActionResult<CategoriesVm>> GetCategories()
        {
            var query = new GetCategoriesQuery();
            var result = await _mediator.Send(query);

            return Ok(result);
        }

        // GET api/v1/products/{id}/download
        [HttpGet("{id}/download")]
        [Authorize]
        public async Task<ActionResult<ProductDownloadUrlVm>> GetProductDownloadUrl(int id)
        {
            string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var query = new GetProductDownloadUrlQuery
            {
                ProductId = id,
                UserId = userId
            };

            var result = await _mediator.Send(query);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        // POST api/v1/products
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<CreateProductResponse>> CreateProduct([FromForm] CreateProductCommand command)
        {
            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetProductDetail), new { id = result.ProductId }, result);
        }

        // PUT api/v1/products/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UpdateProductResponse>> UpdateProduct(int id, [FromForm] UpdateProductCommand command)
        {
            Console.WriteLine($"Received update request for product ID {id}");

            if (id != command.ProductId)
            {
                Console.WriteLine($"Product ID mismatch: URL ID {id} vs command ID {command.ProductId}");
                return BadRequest(new { Success = false, Message = "Product ID mismatch" });
            }

            try
            {
                var result = await _mediator.Send(command);

                if (!result.Success)
                {
                    Console.WriteLine($"Failed to update product: {result.Message}");
                    return BadRequest(result);
                }

                Console.WriteLine($"Product {id} updated successfully");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception updating product: {ex.Message}");
                return StatusCode(500, new { Success = false, Message = $"Error updating product: {ex.Message}" });
            }
        }

        // PATCH api/v1/products/{id}/status
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<UpdateProductResponse>> UpdateProductStatus(
            int id,
            [FromBody] bool isActive)
        {
            // Get existing product first
            var query = new GetProductDetailQuery { ProductId = id };
            var productDetail = await _mediator.Send(query);

            if (!productDetail.Success)
            {
                return NotFound(new { Success = false, Message = "Product not found" });
            }

            // Prepare update command with just status change
            var command = new UpdateProductCommand
            {
                ProductId = id,
                Name = productDetail.Name,
                Description = productDetail.Description,
                Price = productDetail.Price,
                CategoryId = productDetail.CategoryId,
                ProductType = productDetail.ProductType,
                IsActive = isActive,
                UpdateImage = false,
                UpdateDownloadFile = false
            };

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
    }
}
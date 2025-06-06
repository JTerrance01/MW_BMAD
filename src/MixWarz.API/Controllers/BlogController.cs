using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MixWarz.Application.Features.Blog.Commands.CreateArticle;
using MixWarz.Application.Features.Blog.Commands.CreateCategory;
using MixWarz.Application.Features.Blog.Commands.CreateTag;
using MixWarz.Application.Features.Blog.Commands.DeleteArticle;
using MixWarz.Application.Features.Blog.Commands.DeleteCategory;
using MixWarz.Application.Features.Blog.Commands.DeleteTag;
using MixWarz.Application.Features.Blog.Commands.UpdateArticle;
using MixWarz.Application.Features.Blog.Commands.UpdateCategory;
using MixWarz.Application.Features.Blog.Commands.UpdateTag;
using MixWarz.Application.Features.Blog.Queries.GetArticleBySlug;
using MixWarz.Application.Features.Blog.Queries.GetArticles;
using MixWarz.Application.Features.Blog.Queries.GetCategories;
using MixWarz.Application.Features.Blog.Queries.GetTags;

namespace MixWarz.API.Controllers
{
    [ApiController]
    [Route("api/blog")]
    public class BlogController : ControllerBase
    {
        private readonly IMediator _mediator;

        public BlogController(IMediator mediator)
        {
            _mediator = mediator;
        }

        #region Categories

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            try
            {
                var query = new GetCategoriesQuery();
                var result = await _mediator.Send(query);

                if (result.Success)
                {
                    return Ok(result);
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetCategories: {ex.Message}");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving categories. Please try again later.",
                    Categories = new object[0]
                });
            }
        }

        [HttpPost("categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(CreateCategoryCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.Success)
            {
                return CreatedAtAction(nameof(GetCategories), result);
            }

            return BadRequest(result);
        }

        [HttpPut("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryCommand command)
        {
            if (id != command.Id)
                return BadRequest("Category ID mismatch.");

            var result = await _mediator.Send(command);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpDelete("categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var command = new DeleteCategoryCommand { Id = id };
            var result = await _mediator.Send(command);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        #endregion

        #region Tags

        [HttpGet("tags")]
        public async Task<IActionResult> GetTags()
        {
            try
            {
                var query = new GetTagsQuery();
                var result = await _mediator.Send(query);

                if (result.Success)
                {
                    return Ok(result);
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetTags: {ex.Message}");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving tags. Please try again later.",
                    Tags = new object[0]
                });
            }
        }

        [HttpPost("tags")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateTag(CreateTagCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.Success)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }

        [HttpPut("tags/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTag(int id, UpdateTagCommand command)
        {
            if (id != command.Id)
                return BadRequest("Tag ID mismatch.");

            var result = await _mediator.Send(command);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpDelete("tags/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var command = new DeleteTagCommand { Id = id };
            var result = await _mediator.Send(command);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        #endregion

        #region Articles

        [HttpGet("articles")]
        public async Task<IActionResult> GetArticles([FromQuery] GetArticlesQuery query)
        {
            try
            {
                var result = await _mediator.Send(query);

                if (result.Success)
                {
                    return Ok(result);
                }

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetArticles: {ex.Message}");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while processing your request. Please try again later.",
                    Articles = new object[0],
                    PageNumber = query.PageNumber,
                    PageSize = query.PageSize,
                    TotalPages = 0,
                    TotalItems = 0
                });
            }
        }

        [HttpGet("articles/{slug}")]
        public async Task<IActionResult> GetArticleBySlug(string slug)
        {
            try
            {
                var query = new GetArticleBySlugQuery { Slug = slug };
                var result = await _mediator.Send(query);

                if (result.Success)
                {
                    return Ok(result);
                }

                return NotFound(result);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error in GetArticleBySlug: {ex.Message}");
                return StatusCode(500, new
                {
                    Success = false,
                    Message = "An error occurred while retrieving the article. Please try again later.",
                    Article = (object)null
                });
            }
        }

        [HttpPost("articles")]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<IActionResult> CreateArticle(CreateArticleCommand command)
        {
            var result = await _mediator.Send(command);

            if (result.Success)
            {
                return CreatedAtAction(nameof(GetArticleBySlug), new { slug = result.Article.Slug }, result);
            }

            return BadRequest(result);
        }

        [HttpPut("articles/{id}")]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<IActionResult> UpdateArticle(int id, UpdateArticleCommand command)
        {
            if (id != command.Id)
                return BadRequest("Article ID mismatch.");

            var result = await _mediator.Send(command);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        [HttpDelete("articles/{id}")]
        [Authorize(Roles = "Admin,Editor")]
        public async Task<IActionResult> DeleteArticle(int id)
        {
            var command = new DeleteArticleCommand { Id = id };
            var result = await _mediator.Send(command);

            if (result.Success)
                return Ok(result);

            return BadRequest(result);
        }

        #endregion
    }
}
using MediatR;
using MixWarz.Domain.Interfaces;
using AutoMapper;

namespace MixWarz.Application.Features.Products.Queries.GetCategories
{
    public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, CategoriesVm>
    {
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;
        
        public GetCategoriesQueryHandler(
            IProductRepository productRepository,
            IMapper mapper)
        {
            _productRepository = productRepository;
            _mapper = mapper;
        }
        
        public async Task<CategoriesVm> Handle(
            GetCategoriesQuery request, 
            CancellationToken cancellationToken)
        {
            var categories = await _productRepository.GetAllCategoriesAsync();
            
            var categoryDtos = _mapper.Map<List<CategoryDto>>(categories);
            
            return new CategoriesVm
            {
                Categories = categoryDtos
            };
        }
    }
} 
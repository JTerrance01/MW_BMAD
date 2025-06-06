using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MixWarz.Domain.Entities;
using MixWarz.Application.Common.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MixWarz.Application.Features.Admin.Queries.GetUserDetail
{
    public class GetUserDetailQueryHandler : IRequestHandler<GetUserDetailQuery, UserDetailVm>
    {
        private readonly UserManager<User> _userManager;
        private readonly IAppDbContext _dbContext;
        private readonly IMapper _mapper;

        public GetUserDetailQueryHandler(
            UserManager<User> userManager,
            IAppDbContext dbContext,
            IMapper mapper)
        {
            _userManager = userManager ?? throw new ArgumentNullException(nameof(userManager));
            _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task<UserDetailVm> Handle(GetUserDetailQuery request, CancellationToken cancellationToken)
        {
            // Find the user
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return null;
            }

            // Map to view model
            var userDetail = _mapper.Map<UserDetailVm>(user);

            // Add roles
            userDetail.Roles = (await _userManager.GetRolesAsync(user)).ToList();

            // Get order statistics
            var orderStats = await _dbContext.Orders
                .Where(o => o.UserId == request.UserId)
                .GroupBy(o => o.UserId)
                .Select(g => new
                {
                    OrdersCount = g.Count(),
                    TotalSpent = g.Sum(o => o.TotalAmount)
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (orderStats != null)
            {
                userDetail.OrdersCount = orderStats.OrdersCount;
                userDetail.TotalSpent = orderStats.TotalSpent;
            }

            // Get submission count
            userDetail.SubmissionsCount = await _dbContext.Submissions
                .CountAsync(s => s.UserId == request.UserId, cancellationToken);

            return userDetail;
        }
    }
}
using FluentValidation;

namespace MixWarz.Application.Features.Admin.Commands.UpdateUserRoles
{
    /// <summary>
    /// Validator for the UpdateUserRolesCommand
    /// </summary>
    public class UpdateUserRolesCommandValidator : AbstractValidator<UpdateUserRolesCommand>
    {
        public UpdateUserRolesCommandValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required");
                
            RuleFor(x => x.Roles)
                .NotNull().WithMessage("Roles collection cannot be null");
        }
    }
} 
using FluentValidation;

namespace MixWarz.Application.Features.Auth.Commands.LoginUser
{
    public class LoginUserCommandValidator : AbstractValidator<LoginUserCommand>
    {
        public LoginUserCommandValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Email must be a valid email address");
                
            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Password is required");
        }
    }
} 
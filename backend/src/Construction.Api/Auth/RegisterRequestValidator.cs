using FluentValidation;

namespace Construction.Api.Auth;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Enter a valid email address.");

        When(x => !string.IsNullOrWhiteSpace(x.PhoneNumber), () =>
        {
            RuleFor(x => x.PhoneNumber!)
                .Matches(@"^\+?[0-9][0-9\s\-]{6,19}$")
                .WithMessage("Enter a valid phone number.");
        });

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Use at least 8 characters.")
            .Matches("[a-z]").WithMessage("Include one lowercase character.")
            .Matches("[A-Z]").WithMessage("Include one uppercase character.")
            .Matches("[0-9]").WithMessage("Include one number.")
            .Matches("[^A-Za-z0-9]").WithMessage("Include one special character.");
    }
}

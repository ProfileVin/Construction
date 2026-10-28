using FluentValidation;

namespace Construction.Api.Features.Dashboard;

public class UpdateActivityLogRequestValidator : AbstractValidator<UpdateActivityLogRequest>
{
    public UpdateActivityLogRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(2000).WithMessage("Keep the description under 2000 characters.");
    }
}

using FluentValidation;

namespace Construction.Api.Features.Schedule;

public class CreatePhaseRequestValidator : AbstractValidator<CreatePhaseRequest>
{
    public CreatePhaseRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Phase name is required.")
            .MaximumLength(200).WithMessage("Keep the name under 200 characters.");

        RuleFor(x => x.StartDate)
            .NotEqual(default(DateOnly)).WithMessage("Start date is required.");

        RuleFor(x => x.EndDate)
            .NotEqual(default(DateOnly)).WithMessage("End date is required.")
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be on or after the start date.");

        RuleFor(x => x.PercentComplete)
            .InclusiveBetween(0, 100).WithMessage("Percent complete must be between 0 and 100.");

        RuleFor(x => x.Status).IsInEnum();

        RuleFor(x => x.CheckpointLabel)
            .MaximumLength(300).WithMessage("Keep the checkpoint label under 300 characters.");
    }
}

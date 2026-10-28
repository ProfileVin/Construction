using Construction.Application.Dashboard;
using FluentValidation;

namespace Construction.Api.Features.Dashboard;

public class ExtendTaskDeadlineRequestValidator : AbstractValidator<ExtendTaskDeadlineRequest>
{
    public ExtendTaskDeadlineRequestValidator()
    {
        RuleFor(x => x.Deadline)
            .NotNull().WithMessage("Select a new deadline.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Select a reason for the extension.")
            .Must(r => DeadlineExtensionReasons.All.Contains(r!)).When(x => !string.IsNullOrEmpty(x.Reason))
            .WithMessage("Unknown extension reason.");
    }
}

using FluentValidation;

namespace Construction.Api.Dashboard;

public class CreateProjectTaskRequestValidator : AbstractValidator<CreateProjectTaskRequest>
{
    public CreateProjectTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task title is required.")
            .MaximumLength(200).WithMessage("Keep the title under 200 characters.");

        RuleFor(x => x.AssigneeName)
            .NotEmpty().WithMessage("Assignee is required.")
            .MaximumLength(200).WithMessage("Keep the assignee name under 200 characters.");

        RuleFor(x => x.AssignedDate)
            .NotEqual(default(DateOnly)).WithMessage("Assigned date is required.");

        RuleFor(x => x.Deadline)
            .NotEqual(default(DateOnly)).WithMessage("Deadline is required.")
            .GreaterThanOrEqualTo(x => x.AssignedDate)
            .WithMessage("Deadline must be on or after the assigned date.");
    }
}

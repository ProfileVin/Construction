using FluentValidation;

namespace Construction.Api.Features.Dashboard;

/// <summary>Deadline vs. the stored assigned date is checked by DashboardService.UpdateTaskAsync.</summary>
public class UpdateProjectTaskRequestValidator : AbstractValidator<UpdateProjectTaskRequest>
{
    public UpdateProjectTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task details are required.")
            .MaximumLength(1000).WithMessage("Keep the task details under 1000 characters.");

        RuleFor(x => x.AssigneeName)
            .NotEmpty().WithMessage("Assignee is required.")
            .MaximumLength(200).WithMessage("Keep the assignee name under 200 characters.");

        RuleFor(x => x.Deadline)
            .NotEqual(default(DateOnly)).WithMessage("Deadline is required.");

        RuleFor(x => x.Status).IsInEnum();
    }
}

using Construction.Application.Documents;
using FluentValidation;

namespace Construction.Api.Features.Dashboard;

public class CreateProjectTaskRequestValidator : AbstractValidator<CreateProjectTaskRequest>
{
    public CreateProjectTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Task details are required.")
            .MaximumLength(1000).WithMessage("Keep the task details under 1000 characters.");

        RuleFor(x => x.AssigneeName)
            .NotEmpty().WithMessage("Assignee is required.")
            .MaximumLength(200).WithMessage("Keep the assignee name under 200 characters.");

        RuleFor(x => x.AssignedDate)
            .NotEqual(default(DateOnly)).WithMessage("Assigned date is required.");

        RuleFor(x => x.Deadline)
            .NotEqual(default(DateOnly)).WithMessage("Deadline is required.")
            .GreaterThanOrEqualTo(x => x.AssignedDate)
            .WithMessage("Deadline must be on or after the assigned date.");

        RuleFor(x => x.Status).IsInEnum();

        When(x => x.Attachment is not null, () =>
        {
            RuleFor(x => x.Attachment!)
                .Must(f => f.Length > 0).WithMessage("The attachment is empty.")
                .Must(f => f.Length <= DocumentUploadRules.TaskAttachmentMaxSizeBytes)
                .WithMessage("Attachments must be 25 MB or smaller.")
                .Must(f => DocumentUploadRules.IsAllowedExtension(f.FileName))
                .WithMessage("This file type isn't supported.");
        });
    }
}

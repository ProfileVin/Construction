using Construction.Api.Features.ChangeOrders;
using Construction.Application.Documents;
using FluentValidation;

namespace Construction.Api.Features.Dashboard;

/// <summary>Attachment rules match the change-order upload (count, size, extension).</summary>
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

        RuleFor(x => x.AssignedDate)
            .NotEqual(default(DateOnly)).WithMessage("Logged date is required.");

        RuleFor(x => x.Deadline)
            .NotEqual(default(DateOnly)).WithMessage("Deadline is required.")
            .GreaterThanOrEqualTo(x => x.AssignedDate)
            .WithMessage("Deadline must be on or after the assigned date.");

        RuleFor(x => x.Status).IsInEnum();

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Keep the description under 2000 characters.");

        RuleFor(x => x.Attachments)
            .Must(files => files.Count <= CreateChangeOrderRequestValidator.MaxAttachments)
            .WithMessage($"Attach at most {CreateChangeOrderRequestValidator.MaxAttachments} files at a time.");

        RuleForEach(x => x.Attachments)
            .Must(f => f.Length > 0).WithMessage("An attachment is empty.")
            .Must(f => f.Length <= DocumentUploadRules.TaskAttachmentMaxSizeBytes)
            .WithMessage("Attachments must be 25 MB or smaller.")
            .Must(f => DocumentUploadRules.IsAllowedExtension(f.FileName))
            .WithMessage("This file type isn't supported.");
    }
}

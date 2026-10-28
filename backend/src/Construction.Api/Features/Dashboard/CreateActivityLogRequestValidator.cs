using Construction.Application.Dashboard;
using Construction.Application.Documents;
using FluentValidation;

namespace Construction.Api.Features.Dashboard;

public class CreateActivityLogRequestValidator : AbstractValidator<CreateActivityLogRequest>
{
    public CreateActivityLogRequestValidator()
    {
        RuleFor(x => x.TaskId)
            .NotEmpty().WithMessage("Select a milestone or task.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Select a construction phase.")
            .Must(c => ActivityLogCategories.All.Contains(c!)).When(x => !string.IsNullOrEmpty(x.Category))
            .WithMessage("Unknown construction phase.");

        RuleFor(x => x.AssigneeName)
            .NotEmpty().WithMessage("Assignee is required.")
            .MaximumLength(200).WithMessage("Keep the assignee name under 200 characters.");

        // 2000 = ActivityLogEntries.Description.
        RuleFor(x => x.Note)
            .NotEmpty().WithMessage("A log note is required.")
            .MaximumLength(2000).WithMessage("Keep the note under 2000 characters.");

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

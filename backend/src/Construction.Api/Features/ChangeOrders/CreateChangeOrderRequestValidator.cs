using Construction.Application.ChangeOrders;
using Construction.Application.Documents;
using FluentValidation;

namespace Construction.Api.Features.ChangeOrders;

public class CreateChangeOrderRequestValidator : AbstractValidator<CreateChangeOrderRequest>
{
    public const int MaxAttachments = 5;

    public CreateChangeOrderRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required.")
            .MaximumLength(500).WithMessage("Keep the description under 500 characters.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("Amount is too large.");

        RuleFor(x => x.RequestedDate)
            .NotNull().WithMessage("Date is required.");

        RuleFor(x => x.Reason)
            .NotEmpty().WithMessage("Select a reason.")
            .Must(r => ChangeOrderReasons.All.Contains(r!)).When(x => !string.IsNullOrEmpty(x.Reason))
            .WithMessage("Unknown reason.");

        RuleFor(x => x.Scope)
            .MaximumLength(2000).WithMessage("Keep the summary under 2000 characters.");

        RuleFor(x => x.ScheduleImpactDays)
            .InclusiveBetween(0, 365).WithMessage("Schedule impact must be between 0 and 365 days.");

        RuleFor(x => x.Attachments)
            .Must(files => files.Count <= MaxAttachments).WithMessage($"Attach at most {MaxAttachments} files.");

        RuleForEach(x => x.Attachments)
            .Must(f => f.Length > 0).WithMessage("An attachment is empty.")
            .Must(f => f.Length <= DocumentUploadRules.TaskAttachmentMaxSizeBytes)
            .WithMessage("Attachments must be 25 MB or smaller.")
            .Must(f => DocumentUploadRules.IsAllowedExtension(f.FileName))
            .WithMessage("This file type isn't supported.");
    }
}

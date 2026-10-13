using Construction.Application.Documents;
using FluentValidation;

namespace Construction.Api.Features.Budget;

public class CreateInvoiceRequestValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceRequestValidator()
    {
        RuleFor(x => x.VendorName)
            .NotEmpty().WithMessage("Title is required.")
            .MaximumLength(200).WithMessage("Keep the title under 200 characters.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(x => x.Status).IsInEnum();

        RuleFor(x => x.IssuedDate)
            .NotEqual(default(DateOnly)).WithMessage("Billing date is required.");

        // 40 = Invoices.InvoiceNumber.
        RuleFor(x => x.ReferenceNumber)
            .MaximumLength(40).WithMessage("Keep the reference under 40 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Keep the notes under 2000 characters.");

        When(x => x.Receipt is not null, () =>
        {
            RuleFor(x => x.Receipt!)
                .Must(f => f.Length > 0).WithMessage("The receipt is empty.")
                .Must(f => f.Length <= DocumentUploadRules.TaskAttachmentMaxSizeBytes)
                .WithMessage("Receipts must be 25 MB or smaller.")
                .Must(f => DocumentUploadRules.IsAllowedExtension(f.FileName))
                .WithMessage("This file type isn't supported.");
        });
    }
}

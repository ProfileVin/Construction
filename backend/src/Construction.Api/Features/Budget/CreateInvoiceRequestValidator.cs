using FluentValidation;

namespace Construction.Api.Features.Budget;

public class CreateInvoiceRequestValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceRequestValidator()
    {
        RuleFor(x => x.VendorName)
            .NotEmpty().WithMessage("Vendor is required.")
            .MaximumLength(200).WithMessage("Keep the vendor name under 200 characters.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.");

        RuleFor(x => x.Status).IsInEnum();

        RuleFor(x => x.IssuedDate)
            .NotEqual(default(DateOnly)).WithMessage("Issued date is required.");
    }
}

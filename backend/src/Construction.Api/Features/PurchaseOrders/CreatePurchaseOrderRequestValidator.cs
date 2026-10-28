using FluentValidation;

namespace Construction.Api.Features.PurchaseOrders;

public class CreatePurchaseOrderRequestValidator : AbstractValidator<CreatePurchaseOrderRequest>
{
    public CreatePurchaseOrderRequestValidator()
    {
        RuleFor(x => x.VendorName)
            .NotEmpty().WithMessage("Vendor is required.")
            .MaximumLength(200).WithMessage("Keep the vendor under 200 characters.");

        RuleFor(x => x.LineItems)
            .NotEmpty().WithMessage("Add at least one line item.")
            .Must(items => items is null || items.Count <= 50).WithMessage("A purchase order can have at most 50 line items.");

        RuleForEach(x => x.LineItems).SetValidator(new CreatePurchaseOrderLineRequestValidator());

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Keep the note under 2000 characters.");
    }
}

public class CreatePurchaseOrderLineRequestValidator : AbstractValidator<CreatePurchaseOrderLineRequest>
{
    public CreatePurchaseOrderLineRequestValidator()
    {
        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Item is required.")
            .MaximumLength(200).WithMessage("Keep the item under 200 characters.");

        RuleFor(x => x.Quantity)
            .InclusiveBetween(1, 100_000).WithMessage("Quantity must be between 1 and 100,000.");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be greater than zero.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("Unit price is too large.");
    }
}

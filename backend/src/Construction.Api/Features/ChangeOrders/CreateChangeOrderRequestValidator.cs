using FluentValidation;

namespace Construction.Api.Features.ChangeOrders;

public class CreateChangeOrderRequestValidator : AbstractValidator<CreateChangeOrderRequest>
{
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
            .MaximumLength(2000).WithMessage("Keep the reason under 2000 characters.");
    }
}

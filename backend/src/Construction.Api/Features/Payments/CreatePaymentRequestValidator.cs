using FluentValidation;

namespace Construction.Api.Features.Payments;

public class CreatePaymentRequestValidator : AbstractValidator<CreatePaymentRequest>
{
    public CreatePaymentRequestValidator()
    {
        RuleFor(x => x.Direction)
            .NotNull().WithMessage("Payment type is required.")
            .IsInEnum().WithMessage("Choose a valid payment type.");

        RuleFor(x => x.PartyName)
            .NotEmpty().WithMessage("Client/payee is required.")
            .MaximumLength(200).WithMessage("Keep the client/payee under 200 characters.");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than zero.")
            .LessThanOrEqualTo(1_000_000_000).WithMessage("Amount is too large.");

        RuleFor(x => x.PaymentDate)
            .NotNull().WithMessage("Payment date is required.");

        RuleFor(x => x.Method)
            .NotNull().WithMessage("Payment method is required.")
            .IsInEnum().WithMessage("Choose a valid payment method.");

        RuleFor(x => x.Notes)
            .MaximumLength(2000).WithMessage("Keep the note under 2000 characters.");
    }
}

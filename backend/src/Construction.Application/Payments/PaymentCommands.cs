using Construction.Domain.Entities;

namespace Construction.Application.Payments;

public record CreatePaymentCommand(
    PaymentDirection Direction,
    string PartyName,
    decimal Amount,
    DateOnly PaymentDate,
    PaymentMethod Method,
    string? Notes);

public record PaymentListQuery(string? Search, PaymentStatus? Status, int Page, int PageSize);

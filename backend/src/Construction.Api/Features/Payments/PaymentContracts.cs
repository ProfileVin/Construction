using Construction.Domain.Entities;

namespace Construction.Api.Features.Payments;

/// <summary>
/// "Record Payment". Members are nullable so MVC's implicit [Required] doesn't pre-empt
/// CreatePaymentRequestValidator's messages.
/// </summary>
public class CreatePaymentRequest
{
    public PaymentDirection? Direction { get; set; }

    public string? PartyName { get; set; }

    public decimal Amount { get; set; }

    public DateOnly? PaymentDate { get; set; }

    public PaymentMethod? Method { get; set; }

    public string? Notes { get; set; }
}

public record PaymentDto(
    Guid Id,
    Guid ProjectId,
    string PaymentNumber,
    PaymentDirection Direction,
    string PartyName,
    decimal Amount,
    DateOnly PaymentDate,
    PaymentMethod Method,
    PaymentStatus Status,
    string? Notes,
    DateTime CreatedAt)
{
    public static PaymentDto From(Construction.Application.Payments.PaymentDto p) => new(
        p.Id, p.ProjectId, p.PaymentNumber, p.Direction, p.PartyName, p.Amount,
        p.PaymentDate, p.Method, p.Status, p.Notes, p.CreatedAt);
}

public record PaymentSummaryResponse(decimal TotalReceived, decimal TotalDisbursed)
{
    public static PaymentSummaryResponse From(Construction.Application.Payments.PaymentSummaryDto s) =>
        new(s.TotalReceived, s.TotalDisbursed);
}

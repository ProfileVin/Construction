using Construction.Domain.Entities;

namespace Construction.Application.Payments;

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
    public static PaymentDto From(Payment p) => new(
        p.Id, p.ProjectId, p.PaymentNumber, p.Direction, p.PartyName, p.Amount,
        p.PaymentDate, p.Method, p.Status, p.Notes, p.CreatedAt);
}

/// <summary>Cleared payments only — Processing money hasn't landed yet (ADR-0028).</summary>
public record PaymentSummaryDto(decimal TotalReceived, decimal TotalDisbursed);

public enum PaymentDeleteStatus
{
    Deleted,
    NotFound,
    NotProcessing,
}

using Construction.Domain.Entities;

namespace Construction.Api.Features.ChangeOrders;

/// <summary>
/// "New Change Order". Members are nullable so MVC's implicit [Required] doesn't pre-empt
/// CreateChangeOrderRequestValidator's messages.
/// </summary>
public class CreateChangeOrderRequest
{
    public string? Description { get; set; }

    public decimal Amount { get; set; }

    public DateOnly? RequestedDate { get; set; }

    public string? Reason { get; set; }
}

public record ChangeOrderDto(
    Guid Id,
    Guid ProjectId,
    string CoNumber,
    string Description,
    decimal Amount,
    ChangeOrderStatus Status,
    DateOnly RequestedDate,
    string? Reason,
    DateTime? DecidedAt,
    DateTime CreatedAt)
{
    public static ChangeOrderDto From(Construction.Application.ChangeOrders.ChangeOrderDto c) => new(
        c.Id, c.ProjectId, c.CoNumber, c.Description, c.Amount, c.Status,
        c.RequestedDate, c.Reason, c.DecidedAt, c.CreatedAt);
}

public record ChangeOrderSummaryResponse(decimal TotalChangeOrders, decimal PendingApprovals, decimal Approved)
{
    public static ChangeOrderSummaryResponse From(Construction.Application.ChangeOrders.ChangeOrderSummaryDto s) =>
        new(s.TotalChangeOrders, s.PendingApprovals, s.Approved);
}

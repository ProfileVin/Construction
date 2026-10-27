using Construction.Domain.Entities;

namespace Construction.Application.ChangeOrders;

public record ChangeOrderListQuery(string? Search, ChangeOrderStatus? Status, int Page, int PageSize);

public record CreateChangeOrderCommand(string Description, decimal Amount, DateOnly RequestedDate, string? Reason);

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
    public static ChangeOrderDto From(ChangeOrder c) => new(
        c.Id, c.ProjectId, c.CoNumber, c.Description, c.Amount, c.Status,
        c.RequestedDate, c.Reason, c.DecidedAt, c.CreatedAt);
}

public record ChangeOrderSummaryDto(decimal TotalChangeOrders, decimal PendingApprovals, decimal Approved);

public enum ChangeOrderDecision
{
    Approve,
    Reject,
}

public enum ChangeOrderDecisionStatus
{
    Decided,
    NotFound,
    NotPending,
}

public record ChangeOrderDecisionResult(ChangeOrderDecisionStatus Status, ChangeOrderDto? ChangeOrder = null);

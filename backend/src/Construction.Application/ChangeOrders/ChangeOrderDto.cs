using Construction.Application.Dashboard;
using Construction.Domain.Entities;

namespace Construction.Application.ChangeOrders;

public record ChangeOrderListQuery(string? Search, ChangeOrderStatus? Status, int Page, int PageSize);

public record CreateChangeOrderCommand(
    string Description,
    decimal Amount,
    DateOnly RequestedDate,
    string? Reason,
    string? Scope = null,
    Guid? CategoryId = null,
    int ScheduleImpactDays = 0,
    IReadOnlyList<TaskAttachment>? Attachments = null);

/// <summary>The reasons a change order can be raised for ("New Change Order" dropdown).</summary>
public static class ChangeOrderReasons
{
    public static readonly IReadOnlyList<string> All =
    [
        "Client Request", "Design Change", "Site Condition", "Code / Inspection Requirement",
        "Value Engineering", "Owner Upgrade", "Other",
    ];
}

public record ChangeOrderAttachmentDto(Guid DocumentId, string FileName, long SizeBytes, DocumentFormat Format);

public record ChangeOrderDto(
    Guid Id,
    Guid ProjectId,
    string CoNumber,
    string Description,
    decimal Amount,
    ChangeOrderStatus Status,
    DateOnly RequestedDate,
    string? Reason,
    string? Scope,
    Guid? CategoryId,
    string? CategoryName,
    int ScheduleImpactDays,
    string? RequestedByName,
    DateTime? ContractorReviewedAt,
    string? ContractorReviewedByName,
    string? OwnerDecidedByName,
    DateTime? DecidedAt,
    DateTime CreatedAt,
    IReadOnlyList<ChangeOrderAttachmentDto> Attachments)
{
    /// <summary>Attachments are only filled by the single-item read (GET {id}); lists leave them empty.</summary>
    public static ChangeOrderDto From(
        ChangeOrder c, string? categoryName = null, IReadOnlyList<ChangeOrderAttachmentDto>? attachments = null) => new(
        c.Id, c.ProjectId, c.CoNumber, c.Description, c.Amount, c.Status, c.RequestedDate, c.Reason, c.Scope,
        c.CategoryId, categoryName, c.ScheduleImpactDays, c.RequestedByName, c.ContractorReviewedAt,
        c.ContractorReviewedByName, c.OwnerDecidedByName, c.DecidedAt, c.CreatedAt, attachments ?? []);
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

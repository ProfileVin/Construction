using Construction.Domain.Entities;

namespace Construction.Api.Features.ChangeOrders;

/// <summary>
/// "New Change Order", sent as multipart/form-data so attachments can ride along. Members are nullable so
/// MVC's implicit [Required] doesn't pre-empt CreateChangeOrderRequestValidator's messages.
/// </summary>
public class CreateChangeOrderRequest
{
    public string? Description { get; set; }

    public decimal Amount { get; set; }

    public DateOnly? RequestedDate { get; set; }

    /// <summary>One of <see cref="Construction.Application.ChangeOrders.ChangeOrderReasons"/>.</summary>
    public string? Reason { get; set; }

    public string? Scope { get; set; }

    public Guid? CategoryId { get; set; }

    public int ScheduleImpactDays { get; set; }

    public List<IFormFile> Attachments { get; set; } = [];
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
    public static ChangeOrderDto From(Construction.Application.ChangeOrders.ChangeOrderDto c) => new(
        c.Id, c.ProjectId, c.CoNumber, c.Description, c.Amount, c.Status, c.RequestedDate, c.Reason, c.Scope,
        c.CategoryId, c.CategoryName, c.ScheduleImpactDays, c.RequestedByName, c.ContractorReviewedAt,
        c.ContractorReviewedByName, c.OwnerDecidedByName, c.DecidedAt, c.CreatedAt,
        c.Attachments.Select(a => new ChangeOrderAttachmentDto(a.DocumentId, a.FileName, a.SizeBytes, a.Format)).ToList());
}

public record ChangeOrderSummaryResponse(decimal TotalChangeOrders, decimal PendingApprovals, decimal Approved)
{
    public static ChangeOrderSummaryResponse From(Construction.Application.ChangeOrders.ChangeOrderSummaryDto s) =>
        new(s.TotalChangeOrders, s.PendingApprovals, s.Approved);
}

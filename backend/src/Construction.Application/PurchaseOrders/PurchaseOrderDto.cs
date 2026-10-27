using Construction.Domain.Entities;

namespace Construction.Application.PurchaseOrders;

public record PurchaseOrderLineItemDto(Guid Id, string Description, int Quantity, decimal UnitPrice, decimal LineTotal)
{
    public static PurchaseOrderLineItemDto From(PurchaseOrderLineItem l) =>
        new(l.Id, l.Description, l.Quantity, l.UnitPrice, l.LineTotal);
}

public record PurchaseOrderDto(
    Guid Id,
    Guid ProjectId,
    string PoNumber,
    string VendorName,
    string ItemSummary,
    decimal TotalAmount,
    PurchaseOrderStatus Status,
    DateOnly IssuedDate,
    DateOnly? DeliveryDate,
    string? Notes,
    DateTime CreatedAt,
    IReadOnlyList<PurchaseOrderLineItemDto> LineItems)
{
    public static PurchaseOrderDto From(PurchaseOrder o) => new(
        o.Id, o.ProjectId, o.PoNumber, o.VendorName, SummarizeItems(o.LineItems), o.TotalAmount, o.Status,
        o.IssuedDate, o.DeliveryDate, o.Notes, o.CreatedAt,
        o.LineItems.Select(PurchaseOrderLineItemDto.From).ToList());

    /// <summary>The second line under the vendor: "Electrical materials +2 more".</summary>
    private static string SummarizeItems(IReadOnlyList<PurchaseOrderLineItem> lines) => lines.Count switch
    {
        0 => string.Empty,
        1 => lines[0].Description,
        _ => $"{lines[0].Description} +{lines.Count - 1} more",
    };
}

public record PurchaseOrderSummaryDto(
    decimal TotalCommitted,
    decimal PendingApprovals,
    decimal DisbursedToDate,
    decimal Unallocated);

public enum PurchaseOrderDeleteStatus
{
    Deleted,
    NotFound,
    NotPending,
}

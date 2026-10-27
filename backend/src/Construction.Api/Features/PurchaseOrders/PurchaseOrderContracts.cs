using Construction.Domain.Entities;

namespace Construction.Api.Features.PurchaseOrders;

/// <summary>
/// "Create Purchase Order". Members are nullable so MVC's implicit [Required] doesn't pre-empt
/// CreatePurchaseOrderRequestValidator's messages.
/// </summary>
public class CreatePurchaseOrderRequest
{
    public string? VendorName { get; set; }

    public List<CreatePurchaseOrderLineRequest>? LineItems { get; set; }

    public DateOnly? DeliveryDate { get; set; }

    public string? Notes { get; set; }
}

public class CreatePurchaseOrderLineRequest
{
    public string? Description { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }
}

public record PurchaseOrderLineItemDto(Guid Id, string Description, int Quantity, decimal UnitPrice, decimal LineTotal)
{
    public static PurchaseOrderLineItemDto From(Construction.Application.PurchaseOrders.PurchaseOrderLineItemDto l) =>
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
    public static PurchaseOrderDto From(Construction.Application.PurchaseOrders.PurchaseOrderDto o) => new(
        o.Id, o.ProjectId, o.PoNumber, o.VendorName, o.ItemSummary, o.TotalAmount, o.Status,
        o.IssuedDate, o.DeliveryDate, o.Notes, o.CreatedAt,
        o.LineItems.Select(PurchaseOrderLineItemDto.From).ToList());
}

public record PurchaseOrderSummaryResponse(
    decimal TotalCommitted,
    decimal PendingApprovals,
    decimal DisbursedToDate,
    decimal Unallocated)
{
    public static PurchaseOrderSummaryResponse From(Construction.Application.PurchaseOrders.PurchaseOrderSummaryDto s) =>
        new(s.TotalCommitted, s.PendingApprovals, s.DisbursedToDate, s.Unallocated);
}

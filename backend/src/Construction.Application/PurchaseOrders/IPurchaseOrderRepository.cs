using Construction.Domain.Entities;

namespace Construction.Application.PurchaseOrders;

public interface IPurchaseOrderRepository
{
    Task<(IReadOnlyList<PurchaseOrder> Items, int TotalCount)> SearchAsync(
        Guid projectId, PurchaseOrderListQuery query, CancellationToken cancellationToken);

    Task<PurchaseOrder?> GetAsync(Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken);

    /// <summary>max(Sequence) + 1 — not a count, so deleting an older PO can't produce a duplicate number.</summary>
    Task<int> NextSequenceAsync(Guid projectId, CancellationToken cancellationToken);

    Task<PurchaseOrderTotals> GetTotalsAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken);

    void Remove(PurchaseOrder purchaseOrder);
}

public record PurchaseOrderTotals(decimal Pending, decimal Paid)
{
    public decimal Committed => Pending + Paid;
}

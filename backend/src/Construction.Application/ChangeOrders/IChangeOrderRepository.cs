using Construction.Domain.Entities;

namespace Construction.Application.ChangeOrders;

public interface IChangeOrderRepository
{
    Task<(IReadOnlyList<ChangeOrder> Items, int TotalCount)> SearchAsync(
        Guid projectId, ChangeOrderListQuery query, CancellationToken cancellationToken);

    Task<ChangeOrder?> GetAsync(Guid projectId, Guid changeOrderId, CancellationToken cancellationToken);

    /// <summary>max(Sequence) + 1, as for purchase orders (ADR-0024).</summary>
    Task<int> NextSequenceAsync(Guid projectId, CancellationToken cancellationToken);

    Task<ChangeOrderTotals> GetTotalsAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(ChangeOrder changeOrder, CancellationToken cancellationToken);

    Task AddAttachmentAsync(ChangeOrderAttachment attachment, CancellationToken cancellationToken);

    /// <summary>The change order's attached documents, in upload order.</summary>
    Task<IReadOnlyList<ProjectDocument>> ListAttachmentsAsync(Guid changeOrderId, CancellationToken cancellationToken);
}

/// <summary><paramref name="Pending"/> covers both approval steps (GC review and owner sign-off).</summary>
public record ChangeOrderTotals(decimal Pending, decimal Approved, decimal Rejected)
{
    /// <summary>Rejected change orders are excluded — they never reach the contract.</summary>
    public decimal Total => Pending + Approved;
}

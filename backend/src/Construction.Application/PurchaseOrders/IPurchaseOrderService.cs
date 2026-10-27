using Construction.Application.Common;

namespace Construction.Application.PurchaseOrders;

public interface IPurchaseOrderService
{
    Task<PagedResult<PurchaseOrderDto>?> SearchAsync(
        string ownerId, Guid projectId, PurchaseOrderListQuery query, CancellationToken cancellationToken);

    Task<PurchaseOrderSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<PurchaseOrderDto?> CreateAsync(
        string ownerId, Guid projectId, CreatePurchaseOrderCommand command, CancellationToken cancellationToken);

    Task<PurchaseOrderDto?> MarkPaidAsync(
        string ownerId, Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken);

    /// <summary>Only Pending POs can be deleted; a Paid one has already been disbursed.</summary>
    Task<PurchaseOrderDeleteStatus> DeleteAsync(
        string ownerId, Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken);
}

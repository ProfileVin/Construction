using Construction.Application.Common;

namespace Construction.Application.ChangeOrders;

public interface IChangeOrderService
{
    Task<PagedResult<ChangeOrderDto>?> SearchAsync(
        string ownerId, Guid projectId, ChangeOrderListQuery query, CancellationToken cancellationToken);

    Task<ChangeOrderSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    /// <summary>One change order with its category name and attachments; null when not the owner's.</summary>
    Task<ChangeOrderDto?> GetAsync(string ownerId, Guid projectId, Guid changeOrderId, CancellationToken cancellationToken);

    Task<ChangeOrderDto?> CreateAsync(
        string ownerId, Guid projectId, CreateChangeOrderCommand command, CancellationToken cancellationToken);

    /// <summary>
    /// Approve advances one step (GC review → owner sign-off → Approved); reject ends it at the current step.
    /// Only a change order awaiting either step can be decided.
    /// </summary>
    Task<ChangeOrderDecisionResult> DecideAsync(
        string ownerId, Guid projectId, Guid changeOrderId, ChangeOrderDecision decision, CancellationToken cancellationToken);
}

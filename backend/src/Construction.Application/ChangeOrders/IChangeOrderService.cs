using Construction.Application.Common;

namespace Construction.Application.ChangeOrders;

public interface IChangeOrderService
{
    Task<PagedResult<ChangeOrderDto>?> SearchAsync(
        string ownerId, Guid projectId, ChangeOrderListQuery query, CancellationToken cancellationToken);

    Task<ChangeOrderSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<ChangeOrderDto?> CreateAsync(
        string ownerId, Guid projectId, CreateChangeOrderCommand command, CancellationToken cancellationToken);

    /// <summary>Approve or reject; only a Pending change order can be decided.</summary>
    Task<ChangeOrderDecisionResult> DecideAsync(
        string ownerId, Guid projectId, Guid changeOrderId, ChangeOrderDecision decision, CancellationToken cancellationToken);
}

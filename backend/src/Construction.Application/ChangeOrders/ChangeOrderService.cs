using Construction.Application.Common;
using Construction.Application.Projects;
using Construction.Domain.Entities;

namespace Construction.Application.ChangeOrders;

public class ChangeOrderService(
    IProjectRepository projects,
    IChangeOrderRepository changeOrders,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IChangeOrderService
{
    public async Task<PagedResult<ChangeOrderDto>?> SearchAsync(
        string ownerId, Guid projectId, ChangeOrderListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await changeOrders.SearchAsync(projectId, query, cancellationToken);
        return new PagedResult<ChangeOrderDto>(
            items.Select(ChangeOrderDto.From).ToList(), totalCount,
            Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<ChangeOrderSummaryDto?> GetSummaryAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var totals = await changeOrders.GetTotalsAsync(projectId, cancellationToken);
        return new ChangeOrderSummaryDto(totals.Total, totals.Pending, totals.Approved);
    }

    public async Task<ChangeOrderDto?> CreateAsync(
        string ownerId, Guid projectId, CreateChangeOrderCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var sequence = await changeOrders.NextSequenceAsync(projectId, cancellationToken);
        var changeOrder = ChangeOrder.Create(
            projectId, sequence, command.Description, command.Amount, command.RequestedDate, command.Reason, nowUtc);

        await changeOrders.AddAsync(changeOrder, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ChangeOrderDto.From(changeOrder);
    }

    public async Task<ChangeOrderDecisionResult> DecideAsync(
        string ownerId, Guid projectId, Guid changeOrderId, ChangeOrderDecision decision, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.NotFound);
        }

        var changeOrder = await changeOrders.GetAsync(projectId, changeOrderId, cancellationToken);
        if (changeOrder is null)
        {
            return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.NotFound);
        }

        if (changeOrder.Status != ChangeOrderStatus.Pending)
        {
            return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.NotPending);
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        if (decision == ChangeOrderDecision.Approve)
        {
            changeOrder.Approve(nowUtc);
        }
        else
        {
            changeOrder.Reject(nowUtc);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.Decided, ChangeOrderDto.From(changeOrder));
    }
}

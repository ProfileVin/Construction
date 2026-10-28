using Construction.Application.Common;
using Construction.Application.Projects;
using Construction.Domain.Entities;

namespace Construction.Application.PurchaseOrders;

public class PurchaseOrderService(
    IProjectRepository projects,
    IPurchaseOrderRepository purchaseOrders,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IPurchaseOrderService
{
    public async Task<PagedResult<PurchaseOrderDto>?> SearchAsync(
        string ownerId, Guid projectId, PurchaseOrderListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await purchaseOrders.SearchAsync(projectId, query, cancellationToken);
        return new PagedResult<PurchaseOrderDto>(
            items.Select(PurchaseOrderDto.From).ToList(), totalCount,
            Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<PurchaseOrderSummaryDto?> GetSummaryAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await projects.GetForOwnerAsync(projectId, ownerId, cancellationToken);
        if (project is null)
        {
            return null;
        }

        var totals = await purchaseOrders.GetTotalsAsync(projectId, cancellationToken);
        return new PurchaseOrderSummaryDto(
            totals.Committed, totals.Pending, totals.Paid, project.BudgetTotal - totals.Committed);
    }

    public async Task<PurchaseOrderDto?> CreateAsync(
        string ownerId, Guid projectId, CreatePurchaseOrderCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var sequence = await purchaseOrders.NextSequenceAsync(projectId, cancellationToken);
        var order = PurchaseOrder.Create(
            projectId,
            sequence,
            command.VendorName,
            command.LineItems.Select(l => (l.Description, l.Quantity, l.UnitPrice)),
            DateOnly.FromDateTime(nowUtc),
            command.DeliveryDate,
            command.Notes,
            nowUtc);

        await purchaseOrders.AddAsync(order, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PurchaseOrderDto.From(order);
    }

    public async Task<PurchaseOrderDto?> MarkPaidAsync(
        string ownerId, Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var order = await purchaseOrders.GetAsync(projectId, purchaseOrderId, cancellationToken);
        if (order is null)
        {
            return null;
        }

        order.MarkPaid(timeProvider.GetUtcNow().UtcDateTime);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PurchaseOrderDto.From(order);
    }

    public async Task<PurchaseOrderDeleteStatus> DeleteAsync(
        string ownerId, Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return PurchaseOrderDeleteStatus.NotFound;
        }

        var order = await purchaseOrders.GetAsync(projectId, purchaseOrderId, cancellationToken);
        if (order is null)
        {
            return PurchaseOrderDeleteStatus.NotFound;
        }

        if (order.Status != PurchaseOrderStatus.Pending)
        {
            return PurchaseOrderDeleteStatus.NotPending;
        }

        purchaseOrders.Remove(order);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return PurchaseOrderDeleteStatus.Deleted;
    }
}

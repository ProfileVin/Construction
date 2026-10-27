using Construction.Application.PurchaseOrders;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class PurchaseOrderRepository(AppDbContext db) : IPurchaseOrderRepository
{
    public async Task<(IReadOnlyList<PurchaseOrder> Items, int TotalCount)> SearchAsync(
        Guid projectId, PurchaseOrderListQuery query, CancellationToken cancellationToken)
    {
        var q = db.PurchaseOrders.Where(o => o.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            q = q.Where(o =>
                EF.Functions.Like(o.PoNumber, term) ||
                EF.Functions.Like(o.VendorName, term) ||
                o.LineItems.Any(l => EF.Functions.Like(l.Description, term)));
        }

        if (query.Status is { } status)
        {
            q = q.Where(o => o.Status == status);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var safePage = Math.Max(1, query.Page);
        var safePageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .Include(o => o.LineItems)
            .OrderByDescending(o => o.IssuedDate).ThenByDescending(o => o.Sequence)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<PurchaseOrder?> GetAsync(Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken)
    {
        return await db.PurchaseOrders
            .Include(o => o.LineItems)
            .FirstOrDefaultAsync(o => o.ProjectId == projectId && o.Id == purchaseOrderId, cancellationToken);
    }

    public async Task<int> NextSequenceAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var max = await db.PurchaseOrders
            .Where(o => o.ProjectId == projectId)
            .MaxAsync(o => (int?)o.Sequence, cancellationToken);
        return (max ?? 0) + 1;
    }

    public async Task<PurchaseOrderTotals> GetTotalsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var sums = await db.PurchaseOrders
            .Where(o => o.ProjectId == projectId)
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Total = g.Sum(o => o.TotalAmount) })
            .ToListAsync(cancellationToken);

        decimal SumFor(PurchaseOrderStatus status) => sums.FirstOrDefault(s => s.Status == status)?.Total ?? 0;
        return new PurchaseOrderTotals(SumFor(PurchaseOrderStatus.Pending), SumFor(PurchaseOrderStatus.Paid));
    }

    public Task AddAsync(PurchaseOrder purchaseOrder, CancellationToken cancellationToken)
    {
        db.PurchaseOrders.Add(purchaseOrder);
        return Task.CompletedTask;
    }

    public void Remove(PurchaseOrder purchaseOrder)
    {
        db.PurchaseOrders.Remove(purchaseOrder);
    }
}

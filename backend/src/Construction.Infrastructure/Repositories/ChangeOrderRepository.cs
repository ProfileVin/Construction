using Construction.Application.ChangeOrders;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class ChangeOrderRepository(AppDbContext db) : IChangeOrderRepository
{
    public async Task<(IReadOnlyList<ChangeOrder> Items, int TotalCount)> SearchAsync(
        Guid projectId, ChangeOrderListQuery query, CancellationToken cancellationToken)
    {
        var q = db.ChangeOrders.Where(c => c.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            q = q.Where(c =>
                EF.Functions.Like(c.CoNumber, term) ||
                EF.Functions.Like(c.Description, term) ||
                (c.Reason != null && EF.Functions.Like(c.Reason, term)) ||
                (c.Scope != null && EF.Functions.Like(c.Scope, term)));
        }

        if (query.Status is { } status)
        {
            q = q.Where(c => c.Status == status);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var safePage = Math.Max(1, query.Page);
        var safePageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderByDescending(c => c.RequestedDate).ThenByDescending(c => c.Sequence)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<ChangeOrder?> GetAsync(Guid projectId, Guid changeOrderId, CancellationToken cancellationToken)
    {
        return await db.ChangeOrders
            .FirstOrDefaultAsync(c => c.ProjectId == projectId && c.Id == changeOrderId, cancellationToken);
    }

    public async Task<int> NextSequenceAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var max = await db.ChangeOrders
            .Where(c => c.ProjectId == projectId)
            .MaxAsync(c => (int?)c.Sequence, cancellationToken);
        return (max ?? 0) + 1;
    }

    public async Task<ChangeOrderTotals> GetTotalsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var sums = await db.ChangeOrders
            .Where(c => c.ProjectId == projectId)
            .GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Total = g.Sum(c => c.Amount) })
            .ToListAsync(cancellationToken);

        decimal SumFor(ChangeOrderStatus status) => sums.FirstOrDefault(s => s.Status == status)?.Total ?? 0;
        return new ChangeOrderTotals(
            SumFor(ChangeOrderStatus.Pending) + SumFor(ChangeOrderStatus.PendingOwnerApproval),
            SumFor(ChangeOrderStatus.Approved), SumFor(ChangeOrderStatus.Rejected));
    }

    public Task AddAsync(ChangeOrder changeOrder, CancellationToken cancellationToken)
    {
        db.ChangeOrders.Add(changeOrder);
        return Task.CompletedTask;
    }

    public Task AddAttachmentAsync(ChangeOrderAttachment attachment, CancellationToken cancellationToken)
    {
        db.ChangeOrderAttachments.Add(attachment);
        return Task.CompletedTask;
    }

    public async Task<IReadOnlyList<ProjectDocument>> ListAttachmentsAsync(
        Guid changeOrderId, CancellationToken cancellationToken)
    {
        return await db.ChangeOrderAttachments
            .Where(a => a.ChangeOrderId == changeOrderId)
            .Join(db.ProjectDocuments, a => a.DocumentId, d => d.Id, (_, d) => d)
            .OrderBy(d => d.CreatedAt).ThenBy(d => d.OriginalFileName)
            .ToListAsync(cancellationToken);
    }
}

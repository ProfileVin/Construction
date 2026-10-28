using Construction.Application.Budget;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class InvoiceRepository(AppDbContext db) : IInvoiceRepository
{
    public async Task<IReadOnlyList<Invoice>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.Invoices
            .Where(i => i.ProjectId == projectId)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IReadOnlyList<Invoice> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, int page, int pageSize, CancellationToken cancellationToken)
    {
        var q = db.Invoices.Where(i => i.ProjectId == projectId);

        var totalCount = await q.CountAsync(cancellationToken);

        var safePage = Math.Max(1, page);
        var safePageSize = Math.Clamp(pageSize, 1, 100);

        var items = await q
            .OrderByDescending(i => i.IssuedDate).ThenByDescending(i => i.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.Invoices.CountAsync(i => i.ProjectId == projectId, cancellationToken);
    }

    public Task AddAsync(Invoice invoice, CancellationToken cancellationToken)
    {
        db.Invoices.Add(invoice);
        return Task.CompletedTask;
    }
}

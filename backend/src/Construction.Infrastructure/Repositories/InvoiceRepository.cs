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
        Guid projectId, InvoiceListQuery query, CancellationToken cancellationToken)
    {
        var q = db.Invoices.Where(i => i.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            q = q.Where(i => EF.Functions.Like(i.InvoiceNumber, term) || EF.Functions.Like(i.VendorName, term));
        }

        if (query.Status is { } status)
        {
            q = q.Where(i => i.Status == status);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var safePage = Math.Max(1, query.Page);
        var safePageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderByDescending(i => i.IssuedDate).ThenByDescending(i => i.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Invoice?> GetAsync(Guid projectId, Guid invoiceId, CancellationToken cancellationToken)
    {
        return await db.Invoices
            .FirstOrDefaultAsync(i => i.ProjectId == projectId && i.Id == invoiceId, cancellationToken);
    }

    public async Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.Invoices.CountAsync(i => i.ProjectId == projectId, cancellationToken);
    }

    public async Task<InvoiceTotals> GetTotalsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var sums = await db.Invoices
            .Where(i => i.ProjectId == projectId)
            .GroupBy(i => i.Status)
            .Select(g => new { Status = g.Key, Total = g.Sum(i => i.Amount) })
            .ToListAsync(cancellationToken);

        decimal SumFor(InvoiceStatus status) => sums.FirstOrDefault(s => s.Status == status)?.Total ?? 0;
        return new InvoiceTotals(SumFor(InvoiceStatus.Pending), SumFor(InvoiceStatus.Paid), SumFor(InvoiceStatus.Scheduled));
    }

    public Task AddAsync(Invoice invoice, CancellationToken cancellationToken)
    {
        db.Invoices.Add(invoice);
        return Task.CompletedTask;
    }
}

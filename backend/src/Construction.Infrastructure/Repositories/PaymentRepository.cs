using Construction.Application.Payments;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class PaymentRepository(AppDbContext db) : IPaymentRepository
{
    public async Task<(IReadOnlyList<Payment> Items, int TotalCount)> SearchAsync(
        Guid projectId, PaymentListQuery query, CancellationToken cancellationToken)
    {
        var q = db.Payments.Where(p => p.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = $"%{query.Search.Trim()}%";
            q = q.Where(p => EF.Functions.Like(p.PaymentNumber, term) || EF.Functions.Like(p.PartyName, term));
        }

        if (query.Status is { } status)
        {
            q = q.Where(p => p.Status == status);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var safePage = Math.Max(1, query.Page);
        var safePageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderByDescending(p => p.PaymentDate).ThenByDescending(p => p.Sequence)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Payment?> GetAsync(Guid projectId, Guid paymentId, CancellationToken cancellationToken)
    {
        return await db.Payments.FirstOrDefaultAsync(p => p.ProjectId == projectId && p.Id == paymentId, cancellationToken);
    }

    public async Task<int> NextSequenceAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var max = await db.Payments
            .Where(p => p.ProjectId == projectId)
            .MaxAsync(p => (int?)p.Sequence, cancellationToken);
        return (max ?? 0) + 1;
    }

    public async Task<PaymentSummaryDto> GetClearedTotalsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var sums = await db.Payments
            .Where(p => p.ProjectId == projectId && p.Status == PaymentStatus.Cleared)
            .GroupBy(p => p.Direction)
            .Select(g => new { Direction = g.Key, Total = g.Sum(p => p.Amount) })
            .ToListAsync(cancellationToken);

        decimal SumFor(PaymentDirection direction) => sums.FirstOrDefault(s => s.Direction == direction)?.Total ?? 0;
        return new PaymentSummaryDto(SumFor(PaymentDirection.Inbound), SumFor(PaymentDirection.Outbound));
    }

    public async Task<IReadOnlyList<string>> GetPartyNamesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        return await db.Payments.Where(p => p.ProjectId == projectId).Select(p => p.PartyName)
            .Union(db.PurchaseOrders.Where(o => o.ProjectId == projectId).Select(o => o.VendorName))
            .Union(db.Invoices.Where(i => i.ProjectId == projectId).Select(i => i.VendorName))
            .OrderBy(name => name)
            .Take(100)
            .ToListAsync(cancellationToken);
    }

    public Task AddAsync(Payment payment, CancellationToken cancellationToken)
    {
        db.Payments.Add(payment);
        return Task.CompletedTask;
    }

    public void Remove(Payment payment)
    {
        db.Payments.Remove(payment);
    }
}

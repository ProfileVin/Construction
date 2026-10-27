using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public interface IInvoiceRepository
{
    Task<IReadOnlyList<Invoice>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Invoice> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, InvoiceListQuery query, CancellationToken cancellationToken);

    Task<Invoice?> GetAsync(Guid projectId, Guid invoiceId, CancellationToken cancellationToken);

    Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<InvoiceTotals> GetTotalsAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(Invoice invoice, CancellationToken cancellationToken);
}

public record InvoiceTotals(decimal Pending, decimal Paid, decimal Scheduled)
{
    public decimal Billed => Pending + Paid + Scheduled;

    /// <summary>Paid and Scheduled are both approved for payment (ADR-0025).</summary>
    public decimal Approved => Paid + Scheduled;
}

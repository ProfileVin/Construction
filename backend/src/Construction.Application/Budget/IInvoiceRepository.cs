using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public interface IInvoiceRepository
{
    Task<IReadOnlyList<Invoice>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<(IReadOnlyList<Invoice> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, int page, int pageSize, CancellationToken cancellationToken);

    Task<int> CountByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task AddAsync(Invoice invoice, CancellationToken cancellationToken);
}

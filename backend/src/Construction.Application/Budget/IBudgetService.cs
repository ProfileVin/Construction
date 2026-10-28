using Construction.Application.Common;

namespace Construction.Application.Budget;

public interface IBudgetService
{
    Task<BudgetSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<PagedResult<InvoiceDto>?> SearchInvoicesAsync(
        string ownerId, Guid projectId, int page, int pageSize, CancellationToken cancellationToken);

    Task<BudgetCategoryDto?> CreateCategoryAsync(
        string ownerId, Guid projectId, CreateBudgetCategoryCommand command, CancellationToken cancellationToken);

    Task<InvoiceDto?> CreateInvoiceAsync(
        string ownerId, Guid projectId, CreateInvoiceCommand command, CancellationToken cancellationToken);
}

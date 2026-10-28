using Construction.Application.Common;

namespace Construction.Application.Budget;

public interface IBudgetService
{
    Task<BudgetSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<PagedResult<InvoiceDto>?> SearchInvoicesAsync(
        string ownerId, Guid projectId, InvoiceListQuery query, CancellationToken cancellationToken);

    Task<InvoiceSummaryDto?> GetInvoiceSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<BudgetCategoryDto?> CreateCategoryAsync(
        string ownerId, Guid projectId, CreateBudgetCategoryCommand command, CancellationToken cancellationToken);

    Task<InvoiceDto?> CreateInvoiceAsync(
        string ownerId, Guid projectId, CreateInvoiceCommand command, CancellationToken cancellationToken);

    Task<InvoiceDto?> MarkInvoicePaidAsync(
        string ownerId, Guid projectId, Guid invoiceId, CancellationToken cancellationToken);
}

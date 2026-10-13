using Construction.Application.Common;
using Construction.Application.Documents;
using Construction.Application.Projects;
using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public class BudgetService(
    IProjectRepository projects,
    IBudgetCategoryRepository categories,
    IInvoiceRepository invoices,
    AttachmentUploader attachments,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IBudgetService
{
    public async Task<BudgetSummaryDto?> GetSummaryAsync(string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await projects.GetForOwnerAsync(projectId, ownerId, cancellationToken);
        if (project is null)
        {
            return null;
        }

        var categoryList = await categories.ListByProjectAsync(projectId, cancellationToken);
        var invoiceList = await invoices.ListByProjectAsync(projectId, cancellationToken);

        var committedPOs = invoiceList.Where(i => i.Status is InvoiceStatus.Pending or InvoiceStatus.Scheduled).Sum(i => i.Amount);
        var unbilledWork = Math.Max(0, categoryList.Sum(c => c.SpentAmount) - invoiceList.Sum(i => i.Amount));

        var contingencyCategory = categoryList.FirstOrDefault(c => c.IsContingency);
        decimal? contingencyBurnPercent = null;
        string? contingencyStatusLabel = null;
        if (contingencyCategory is not null && contingencyCategory.AllocatedAmount > 0)
        {
            contingencyBurnPercent = contingencyCategory.SpentAmount / contingencyCategory.AllocatedAmount * 100;
            contingencyStatusLabel = contingencyBurnPercent switch
            {
                <= 50 => "Healthy",
                <= 80 => "Watch",
                _ => "At Risk",
            };
        }

        return new BudgetSummaryDto(
            categoryList.Select(BudgetCategoryDto.From).ToList(),
            project.BudgetTotal,
            project.TotalSpent,
            project.BudgetTotal - project.TotalSpent,
            committedPOs,
            unbilledWork,
            contingencyBurnPercent,
            contingencyStatusLabel);
    }

    public async Task<PagedResult<InvoiceDto>?> SearchInvoicesAsync(
        string ownerId, Guid projectId, int page, int pageSize, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await invoices.SearchByProjectAsync(projectId, page, pageSize, cancellationToken);
        var categoryNames = (await categories.ListByProjectAsync(projectId, cancellationToken))
            .ToDictionary(c => c.Id, c => c.Name);

        var dtos = items
            .Select(i => InvoiceDto.From(i, i.CategoryId is { } categoryId && categoryNames.TryGetValue(categoryId, out var name) ? name : null))
            .ToList();

        return new PagedResult<InvoiceDto>(dtos, totalCount, Math.Max(1, page), Math.Clamp(pageSize, 1, 100));
    }

    public async Task<BudgetCategoryDto?> CreateCategoryAsync(
        string ownerId, Guid projectId, CreateBudgetCategoryCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var category = BudgetCategory.Create(
            projectId, command.Name, command.AllocatedAmount, command.SpentAmount, command.IsContingency, nowUtc);

        await categories.AddAsync(category, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return BudgetCategoryDto.From(category);
    }

    public async Task<InvoiceDto?> CreateInvoiceAsync(
        string ownerId, Guid projectId, CreateInvoiceCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var invoiceNumber = command.ReferenceNumber?.Trim();
        if (string.IsNullOrEmpty(invoiceNumber))
        {
            var sequence = await invoices.CountByProjectAsync(projectId, cancellationToken) + 1;
            invoiceNumber = $"INV-{command.IssuedDate.Year}-{sequence:000}";
        }

        var receipt = await attachments.BuildAsync(ownerId, projectId, phaseId: null, command.Receipt, nowUtc, cancellationToken);
        var invoice = Invoice.Create(
            projectId, invoiceNumber, command.VendorName, command.CategoryId, command.Amount,
            command.Status, command.IssuedDate, nowUtc, command.Notes, receipt?.Id);

        await attachments.SaveWithAsync(
            receipt, command.Receipt, () => invoices.AddAsync(invoice, cancellationToken), cancellationToken);

        string? categoryName = null;
        if (invoice.CategoryId is { } categoryId)
        {
            var category = (await categories.ListByProjectAsync(projectId, cancellationToken))
                .FirstOrDefault(c => c.Id == categoryId);
            categoryName = category?.Name;
        }

        return InvoiceDto.From(invoice, categoryName);
    }
}

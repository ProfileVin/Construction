using Construction.Application.ChangeOrders;
using Construction.Application.Common;
using Construction.Application.Documents;
using Construction.Application.Projects;
using Construction.Application.PurchaseOrders;
using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public class BudgetService(
    IProjectRepository projects,
    IBudgetCategoryRepository categories,
    IInvoiceRepository invoices,
    IPurchaseOrderRepository purchaseOrders,
    IChangeOrderRepository changeOrders,
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

        // Real POs (Pending + Paid), the same figure as the Purchase Order tab's Total Committed (ADR-0024).
        var committedPOs = (await purchaseOrders.GetTotalsAsync(projectId, cancellationToken)).Committed;
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
        string ownerId, Guid projectId, InvoiceListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await invoices.SearchByProjectAsync(projectId, query, cancellationToken);
        var categoryNames = (await categories.ListByProjectAsync(projectId, cancellationToken))
            .ToDictionary(c => c.Id, c => c.Name);

        var dtos = items
            .Select(i => InvoiceDto.From(i, i.CategoryId is { } categoryId && categoryNames.TryGetValue(categoryId, out var name) ? name : null))
            .ToList();

        return new PagedResult<InvoiceDto>(
            dtos, totalCount, Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<InvoiceSummaryDto?> GetInvoiceSummaryAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        var project = await projects.GetForOwnerAsync(projectId, ownerId, cancellationToken);
        if (project is null)
        {
            return null;
        }

        // Approved change orders extend the contract; Project.BudgetTotal itself is left alone (ADR-0025).
        var approvedChangeOrders = (await changeOrders.GetTotalsAsync(projectId, cancellationToken)).Approved;
        var totals = await invoices.GetTotalsAsync(projectId, cancellationToken);

        return new InvoiceSummaryDto(project.BudgetTotal + approvedChangeOrders, totals.Billed, totals.Approved);
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

        return InvoiceDto.From(invoice, await GetCategoryNameAsync(projectId, invoice.CategoryId, cancellationToken));
    }

    public async Task<InvoiceDto?> MarkInvoicePaidAsync(
        string ownerId, Guid projectId, Guid invoiceId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var invoice = await invoices.GetAsync(projectId, invoiceId, cancellationToken);
        if (invoice is null)
        {
            return null;
        }

        invoice.MarkPaid(timeProvider.GetUtcNow().UtcDateTime);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return InvoiceDto.From(invoice, await GetCategoryNameAsync(projectId, invoice.CategoryId, cancellationToken));
    }

    private async Task<string?> GetCategoryNameAsync(Guid projectId, Guid? categoryId, CancellationToken cancellationToken)
    {
        if (categoryId is null)
        {
            return null;
        }

        var category = (await categories.ListByProjectAsync(projectId, cancellationToken))
            .FirstOrDefault(c => c.Id == categoryId);
        return category?.Name;
    }
}

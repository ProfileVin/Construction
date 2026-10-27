using Construction.Domain.Entities;

namespace Construction.Api.Features.Budget;

/// <summary>
/// "Record New Expense", sent as multipart/form-data so a receipt can ride along. Strings are nullable so
/// MVC's implicit [Required] doesn't pre-empt CreateInvoiceRequestValidator's messages.
/// </summary>
public class CreateInvoiceRequest
{
    /// <summary>The "Expense / Invoice Title" (shown under the invoice number).</summary>
    public string? VendorName { get; set; }

    public Guid? CategoryId { get; set; }

    public decimal Amount { get; set; }

    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;

    public DateOnly IssuedDate { get; set; }

    /// <summary>Optional; replaces the generated INV-{year}-{seq} number.</summary>
    public string? ReferenceNumber { get; set; }

    public string? Notes { get; set; }

    public IFormFile? Receipt { get; set; }
}

public record CategoryDto(
    Guid Id,
    Guid ProjectId,
    string Name,
    decimal AllocatedAmount,
    decimal SpentAmount,
    bool IsContingency,
    DateTime CreatedAt)
{
    public static CategoryDto From(Construction.Application.Budget.BudgetCategoryDto c) => new(
        c.Id, c.ProjectId, c.Name, c.AllocatedAmount, c.SpentAmount, c.IsContingency, c.CreatedAt);
}

public record InvoiceDto(
    Guid Id,
    Guid ProjectId,
    string InvoiceNumber,
    string VendorName,
    Guid? CategoryId,
    string? CategoryName,
    decimal Amount,
    InvoiceStatus Status,
    DateOnly IssuedDate,
    DateTime CreatedAt,
    string? Notes,
    Guid? ReceiptDocumentId)
{
    public static InvoiceDto From(Construction.Application.Budget.InvoiceDto i) => new(
        i.Id, i.ProjectId, i.InvoiceNumber, i.VendorName, i.CategoryId, i.CategoryName,
        i.Amount, i.Status, i.IssuedDate, i.CreatedAt, i.Notes, i.ReceiptDocumentId);
}

public record InvoiceSummaryResponse(decimal TotalContractValue, decimal TotalBilledToDate, decimal ApprovedInvoices)
{
    public static InvoiceSummaryResponse From(Construction.Application.Budget.InvoiceSummaryDto s) =>
        new(s.TotalContractValue, s.TotalBilledToDate, s.ApprovedInvoices);
}

public record BudgetSummaryResponse(
    IReadOnlyList<CategoryDto> Categories,
    decimal TotalAllocated,
    decimal TotalActualSpent,
    decimal RemainingBalance,
    decimal CommittedPOs,
    decimal UnbilledWork,
    decimal? ContingencyBurnPercent,
    string? ContingencyStatusLabel)
{
    public static BudgetSummaryResponse From(Construction.Application.Budget.BudgetSummaryDto s) => new(
        s.Categories.Select(CategoryDto.From).ToList(),
        s.TotalAllocated, s.TotalActualSpent, s.RemainingBalance,
        s.CommittedPOs, s.UnbilledWork, s.ContingencyBurnPercent, s.ContingencyStatusLabel);
}

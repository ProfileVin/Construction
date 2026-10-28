using Construction.Domain.Entities;

namespace Construction.Api.Features.Budget;

public record CreateInvoiceRequest(
    string VendorName,
    Guid? CategoryId,
    decimal Amount,
    InvoiceStatus Status,
    DateOnly IssuedDate);

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
    DateTime CreatedAt)
{
    public static InvoiceDto From(Construction.Application.Budget.InvoiceDto i) => new(
        i.Id, i.ProjectId, i.InvoiceNumber, i.VendorName, i.CategoryId, i.CategoryName,
        i.Amount, i.Status, i.IssuedDate, i.CreatedAt);
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

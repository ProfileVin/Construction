using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public record InvoiceListQuery(string? Search, InvoiceStatus? Status, int Page, int PageSize);

/// <summary>The Invoice tab's KPIs.</summary>
public record InvoiceSummaryDto(decimal TotalContractValue, decimal TotalBilledToDate, decimal ApprovedInvoices);

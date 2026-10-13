using Construction.Application.Dashboard;
using Construction.Domain.Entities;

namespace Construction.Application.Budget;

/// <param name="VendorName">The "Expense / Invoice Title" — shown under the invoice number.</param>
/// <param name="ReferenceNumber">Overrides the generated INV-{year}-{seq} number when given.</param>
public record CreateInvoiceCommand(
    string VendorName,
    Guid? CategoryId,
    decimal Amount,
    InvoiceStatus Status,
    DateOnly IssuedDate,
    string? ReferenceNumber = null,
    string? Notes = null,
    TaskAttachment? Receipt = null);

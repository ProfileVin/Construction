using Construction.Domain.Entities;

namespace Construction.Application.Budget;

public record CreateInvoiceCommand(
    string VendorName,
    Guid? CategoryId,
    decimal Amount,
    InvoiceStatus Status,
    DateOnly IssuedDate);

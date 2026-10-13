using Construction.Domain.Entities;

namespace Construction.Application.Budget;

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
    public static InvoiceDto From(Invoice i, string? categoryName) => new(
        i.Id, i.ProjectId, i.InvoiceNumber, i.VendorName, i.CategoryId, categoryName,
        i.Amount, i.Status, i.IssuedDate, i.CreatedAt, i.Notes, i.ReceiptDocumentId);
}

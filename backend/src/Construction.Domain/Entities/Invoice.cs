namespace Construction.Domain.Entities;

public enum InvoiceStatus
{
    Pending,
    Paid,
}

public class Invoice
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public string InvoiceNumber { get; private set; } = string.Empty;
    public string VendorName { get; private set; } = string.Empty;
    public Guid? CategoryId { get; private set; }
    public decimal Amount { get; private set; }
    public InvoiceStatus Status { get; private set; }
    public DateOnly IssuedDate { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private Invoice()
    {
    }

    public static Invoice Create(
        Guid projectId,
        string invoiceNumber,
        string vendorName,
        Guid? categoryId,
        decimal amount,
        InvoiceStatus status,
        DateOnly issuedDate,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(invoiceNumber))
        {
            throw new ArgumentException("Invoice number is required.", nameof(invoiceNumber));
        }

        if (string.IsNullOrWhiteSpace(vendorName))
        {
            throw new ArgumentException("Vendor is required.", nameof(vendorName));
        }

        if (amount <= 0)
        {
            throw new ArgumentException("Amount must be greater than zero.", nameof(amount));
        }

        return new Invoice
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            InvoiceNumber = invoiceNumber.Trim(),
            VendorName = vendorName.Trim(),
            CategoryId = categoryId,
            Amount = amount,
            Status = status,
            IssuedDate = issuedDate,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }
}

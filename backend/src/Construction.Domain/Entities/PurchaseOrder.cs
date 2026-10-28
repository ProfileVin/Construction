namespace Construction.Domain.Entities;

public enum PurchaseOrderStatus
{
    Pending,
    Paid,
}

/// <summary>A purchase order and its line items — the first parent/child aggregate (ADR-0024).</summary>
public class PurchaseOrder
{
    private readonly List<PurchaseOrderLineItem> _lineItems = [];

    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }

    /// <summary>Per-project running number (max + 1, unique per project).</summary>
    public int Sequence { get; private set; }
    public string PoNumber { get; private set; } = string.Empty;
    public string VendorName { get; private set; } = string.Empty;
    public PurchaseOrderStatus Status { get; private set; }

    /// <summary>Σ line totals, stored so the KPI sums run in SQL.</summary>
    public decimal TotalAmount { get; private set; }
    public DateOnly IssuedDate { get; private set; }
    public DateOnly? DeliveryDate { get; private set; }
    public string? Notes { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public IReadOnlyList<PurchaseOrderLineItem> LineItems => _lineItems;

    private PurchaseOrder()
    {
    }

    public static PurchaseOrder Create(
        Guid projectId,
        int sequence,
        string vendorName,
        IEnumerable<(string Description, int Quantity, decimal UnitPrice)> lineItems,
        DateOnly issuedDate,
        DateOnly? deliveryDate,
        string? notes,
        DateTime nowUtc)
    {
        if (sequence <= 0)
        {
            throw new ArgumentException("Sequence must be positive.", nameof(sequence));
        }

        if (string.IsNullOrWhiteSpace(vendorName))
        {
            throw new ArgumentException("Vendor is required.", nameof(vendorName));
        }

        var order = new PurchaseOrder
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Sequence = sequence,
            PoNumber = $"PO-{sequence:0000}",
            VendorName = vendorName.Trim(),
            Status = PurchaseOrderStatus.Pending,
            IssuedDate = issuedDate,
            DeliveryDate = deliveryDate,
            Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim(),
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };

        foreach (var (description, quantity, unitPrice) in lineItems)
        {
            order._lineItems.Add(PurchaseOrderLineItem.Create(order.Id, description, quantity, unitPrice));
        }

        if (order._lineItems.Count == 0)
        {
            throw new ArgumentException("A purchase order needs at least one line item.", nameof(lineItems));
        }

        order.TotalAmount = Math.Round(order._lineItems.Sum(l => l.LineTotal), 2);
        return order;
    }

    public void MarkPaid(DateTime nowUtc)
    {
        if (Status == PurchaseOrderStatus.Paid)
        {
            return;
        }

        Status = PurchaseOrderStatus.Paid;
        UpdatedAt = nowUtc;
    }
}

public class PurchaseOrderLineItem
{
    public Guid Id { get; private set; }
    public Guid PurchaseOrderId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public int Quantity { get; private set; }
    public decimal UnitPrice { get; private set; }

    public decimal LineTotal => Quantity * UnitPrice;

    private PurchaseOrderLineItem()
    {
    }

    internal static PurchaseOrderLineItem Create(Guid purchaseOrderId, string description, int quantity, decimal unitPrice)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            throw new ArgumentException("Item is required.", nameof(description));
        }

        if (quantity <= 0)
        {
            throw new ArgumentException("Quantity must be at least 1.", nameof(quantity));
        }

        if (unitPrice <= 0)
        {
            throw new ArgumentException("Unit price must be greater than zero.", nameof(unitPrice));
        }

        return new PurchaseOrderLineItem
        {
            Id = Guid.NewGuid(),
            PurchaseOrderId = purchaseOrderId,
            Description = description.Trim(),
            Quantity = quantity,
            UnitPrice = unitPrice,
        };
    }
}

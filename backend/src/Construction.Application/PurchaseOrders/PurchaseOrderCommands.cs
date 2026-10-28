namespace Construction.Application.PurchaseOrders;

public record CreatePurchaseOrderLineCommand(string Description, int Quantity, decimal UnitPrice);

public record CreatePurchaseOrderCommand(
    string VendorName,
    IReadOnlyList<CreatePurchaseOrderLineCommand> LineItems,
    DateOnly? DeliveryDate,
    string? Notes);

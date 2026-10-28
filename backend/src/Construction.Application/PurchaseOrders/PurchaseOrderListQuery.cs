using Construction.Domain.Entities;

namespace Construction.Application.PurchaseOrders;

public record PurchaseOrderListQuery(string? Search, PurchaseOrderStatus? Status, int Page, int PageSize);

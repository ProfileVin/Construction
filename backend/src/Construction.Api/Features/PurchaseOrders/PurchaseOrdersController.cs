using Construction.Api.Common;
using Construction.Application.PurchaseOrders;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.PurchaseOrders;

[ApiController]
[Route("api/projects/{projectId:guid}/budget/purchase-orders")]
[Authorize]
public class PurchaseOrdersController(IPurchaseOrderService purchaseOrderService) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> SearchAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] PurchaseOrderStatus? status,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new PurchaseOrderListQuery(search, status, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);
        var result = await purchaseOrderService.SearchAsync(userId, projectId, query, cancellationToken);

        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<PurchaseOrderDto>(
            result.Items.Select(PurchaseOrderDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("summary")]
    public async Task<IResult> GetSummaryAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var summary = await purchaseOrderService.GetSummaryAsync(userId, projectId, cancellationToken);
        return summary is null ? Results.NotFound() : Results.Ok(PurchaseOrderSummaryResponse.From(summary));
    }

    [HttpPost]
    public async Task<IResult> CreateAsync(
        Guid projectId, [FromBody] CreatePurchaseOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Vendor, at least one line, and each line's description are guaranteed by the validator.
        var command = new CreatePurchaseOrderCommand(
            request.VendorName!,
            request.LineItems!.Select(l => new CreatePurchaseOrderLineCommand(l.Description!, l.Quantity, l.UnitPrice)).ToList(),
            request.DeliveryDate,
            request.Notes);
        var order = await purchaseOrderService.CreateAsync(userId, projectId, command, cancellationToken);

        return order is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/budget/purchase-orders/{order.Id}", PurchaseOrderDto.From(order));
    }

    [HttpPost("{purchaseOrderId:guid}/mark-paid")]
    public async Task<IResult> MarkPaidAsync(Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var order = await purchaseOrderService.MarkPaidAsync(userId, projectId, purchaseOrderId, cancellationToken);
        return order is null ? Results.NotFound() : Results.Ok(PurchaseOrderDto.From(order));
    }

    [HttpDelete("{purchaseOrderId:guid}")]
    public async Task<IResult> DeleteAsync(Guid projectId, Guid purchaseOrderId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        return await purchaseOrderService.DeleteAsync(userId, projectId, purchaseOrderId, cancellationToken) switch
        {
            PurchaseOrderDeleteStatus.Deleted => Results.NoContent(),
            PurchaseOrderDeleteStatus.NotPending => Results.Json(
                new { message = "Only pending purchase orders can be deleted." },
                statusCode: StatusCodes.Status409Conflict),
            _ => Results.NotFound(),
        };
    }
}

using Construction.Api.Common;
using Construction.Application.Budget;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Budget;

[ApiController]
[Route("api/projects/{projectId:guid}/budget")]
[Authorize]
public class BudgetController(IBudgetService budgetService) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IResult> GetSummaryAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var summary = await budgetService.GetSummaryAsync(userId, projectId, cancellationToken);
        return summary is null ? Results.NotFound() : Results.Ok(BudgetSummaryResponse.From(summary));
    }

    [HttpGet("invoices")]
    public async Task<IResult> SearchInvoicesAsync(
        Guid projectId, [FromQuery] int page, [FromQuery] int pageSize, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await budgetService.SearchInvoicesAsync(
            userId, projectId, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize, cancellationToken);

        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<InvoiceDto>(
            result.Items.Select(InvoiceDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpPost("invoices")]
    public async Task<IResult> CreateInvoiceAsync(
        Guid projectId, [FromBody] CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var command = new CreateInvoiceCommand(
            request.VendorName, request.CategoryId, request.Amount, request.Status, request.IssuedDate);
        var invoice = await budgetService.CreateInvoiceAsync(userId, projectId, command, cancellationToken);

        return invoice is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/budget/invoices/{invoice.Id}", InvoiceDto.From(invoice));
    }
}

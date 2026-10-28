using Construction.Api.Common;
using Construction.Application.Budget;
using Construction.Application.Dashboard;
using Construction.Application.Documents;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Budget;

[ApiController]
[Route("api/projects/{projectId:guid}/budget")]
[Authorize]
public class BudgetController(IBudgetService budgetService) : ControllerBase
{
    // Multipart framing adds a little on top of the receipt itself.
    private const long MaxRequestBytes = DocumentUploadRules.TaskAttachmentMaxSizeBytes + (1024 * 1024);

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
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] InvoiceStatus? status,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new InvoiceListQuery(search, status, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);
        var result = await budgetService.SearchInvoicesAsync(userId, projectId, query, cancellationToken);

        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<InvoiceDto>(
            result.Items.Select(InvoiceDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("invoices/summary")]
    public async Task<IResult> GetInvoiceSummaryAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var summary = await budgetService.GetInvoiceSummaryAsync(userId, projectId, cancellationToken);
        return summary is null ? Results.NotFound() : Results.Ok(InvoiceSummaryResponse.From(summary));
    }

    [HttpPost("invoices/{invoiceId:guid}/mark-paid")]
    public async Task<IResult> MarkInvoicePaidAsync(Guid projectId, Guid invoiceId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var invoice = await budgetService.MarkInvoicePaidAsync(userId, projectId, invoiceId, cancellationToken);
        return invoice is null ? Results.NotFound() : Results.Ok(InvoiceDto.From(invoice));
    }

    [HttpPost("invoices")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IResult> CreateInvoiceAsync(
        Guid projectId, [FromForm] CreateInvoiceRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Size/extension are already checked by CreateInvoiceRequestValidator (run by FluentValidationFilter).
        await using var content = request.Receipt?.OpenReadStream();
        var receipt = request.Receipt is { } file
            ? new TaskAttachment(file.FileName, file.ContentType, file.Length, content!)
            : null;

        // A non-empty VendorName (the title) is guaranteed by the validator.
        var command = new CreateInvoiceCommand(
            request.VendorName!, request.CategoryId, request.Amount, request.Status, request.IssuedDate,
            request.ReferenceNumber, request.Notes, receipt);
        var invoice = await budgetService.CreateInvoiceAsync(userId, projectId, command, cancellationToken);

        return invoice is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/budget/invoices/{invoice.Id}", InvoiceDto.From(invoice));
    }
}

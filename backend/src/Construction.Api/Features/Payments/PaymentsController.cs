using Construction.Api.Common;
using Construction.Application.Payments;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Payments;

[ApiController]
[Route("api/projects/{projectId:guid}/budget/payments")]
[Authorize]
public class PaymentsController(IPaymentService paymentService) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> SearchAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] PaymentStatus? status,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new PaymentListQuery(search, status, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);
        var result = await paymentService.SearchAsync(userId, projectId, query, cancellationToken);

        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<PaymentDto>(
            result.Items.Select(PaymentDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("summary")]
    public async Task<IResult> GetSummaryAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var summary = await paymentService.GetSummaryAsync(userId, projectId, cancellationToken);
        return summary is null ? Results.NotFound() : Results.Ok(PaymentSummaryResponse.From(summary));
    }

    [HttpGet("payees")]
    public async Task<IResult> GetPayeesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var names = await paymentService.GetPartyNamesAsync(userId, projectId, cancellationToken);
        return names is null ? Results.NotFound() : Results.Ok(names);
    }

    [HttpPost]
    public async Task<IResult> CreateAsync(
        Guid projectId, [FromBody] CreatePaymentRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Direction, payee, date and method are guaranteed by the validator.
        var command = new CreatePaymentCommand(
            request.Direction!.Value,
            request.PartyName!,
            request.Amount,
            request.PaymentDate!.Value,
            request.Method!.Value,
            request.Notes);
        var payment = await paymentService.CreateAsync(userId, projectId, command, cancellationToken);

        return payment is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/budget/payments/{payment.Id}", PaymentDto.From(payment));
    }

    [HttpPost("{paymentId:guid}/mark-cleared")]
    public async Task<IResult> MarkClearedAsync(Guid projectId, Guid paymentId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var payment = await paymentService.MarkClearedAsync(userId, projectId, paymentId, cancellationToken);
        return payment is null ? Results.NotFound() : Results.Ok(PaymentDto.From(payment));
    }

    [HttpDelete("{paymentId:guid}")]
    public async Task<IResult> DeleteAsync(Guid projectId, Guid paymentId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        return await paymentService.DeleteAsync(userId, projectId, paymentId, cancellationToken) switch
        {
            PaymentDeleteStatus.Deleted => Results.NoContent(),
            PaymentDeleteStatus.NotProcessing => Results.Json(
                new { message = "Only processing payments can be deleted." },
                statusCode: StatusCodes.Status409Conflict),
            _ => Results.NotFound(),
        };
    }
}

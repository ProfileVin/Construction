using Construction.Api.Common;
using Construction.Application.ChangeOrders;
using Construction.Application.Dashboard;
using Construction.Application.Documents;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.ChangeOrders;

[ApiController]
[Route("api/projects/{projectId:guid}/budget/change-orders")]
[Authorize]
public class ChangeOrdersController(IChangeOrderService changeOrderService) : ControllerBase
{
    // Every attachment at its limit, plus a little for multipart framing.
    private const long MaxRequestBytes =
        (CreateChangeOrderRequestValidator.MaxAttachments * DocumentUploadRules.TaskAttachmentMaxSizeBytes) + (1024 * 1024);

    [HttpGet]
    public async Task<IResult> SearchAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] ChangeOrderStatus? status,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new ChangeOrderListQuery(search, status, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);
        var result = await changeOrderService.SearchAsync(userId, projectId, query, cancellationToken);

        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<ChangeOrderDto>(
            result.Items.Select(ChangeOrderDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("summary")]
    public async Task<IResult> GetSummaryAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var summary = await changeOrderService.GetSummaryAsync(userId, projectId, cancellationToken);
        return summary is null ? Results.NotFound() : Results.Ok(ChangeOrderSummaryResponse.From(summary));
    }

    [HttpGet("{changeOrderId:guid}")]
    public async Task<IResult> GetAsync(Guid projectId, Guid changeOrderId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var changeOrder = await changeOrderService.GetAsync(userId, projectId, changeOrderId, cancellationToken);
        return changeOrder is null ? Results.NotFound() : Results.Ok(ChangeOrderDto.From(changeOrder));
    }

    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IResult> CreateAsync(
        Guid projectId, [FromForm] CreateChangeOrderRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Count, size and extension are already checked by CreateChangeOrderRequestValidator.
        var streams = request.Attachments.Select(f => f.OpenReadStream()).ToList();
        try
        {
            var attachments = request.Attachments
                .Select((f, i) => new TaskAttachment(f.FileName, f.ContentType, f.Length, streams[i]))
                .ToList();

            // Description, date and a known reason are guaranteed by the validator.
            var command = new CreateChangeOrderCommand(
                request.Description!, request.Amount, request.RequestedDate!.Value, request.Reason,
                request.Scope, request.CategoryId, request.ScheduleImpactDays, attachments);
            var changeOrder = await changeOrderService.CreateAsync(userId, projectId, command, cancellationToken);

            return changeOrder is null
                ? Results.NotFound()
                : Results.Created(
                    $"/api/projects/{projectId}/budget/change-orders/{changeOrder.Id}", ChangeOrderDto.From(changeOrder));
        }
        finally
        {
            foreach (var stream in streams)
            {
                await stream.DisposeAsync();
            }
        }
    }

    [HttpPost("{changeOrderId:guid}/approve")]
    public Task<IResult> ApproveAsync(Guid projectId, Guid changeOrderId, CancellationToken cancellationToken) =>
        DecideAsync(projectId, changeOrderId, ChangeOrderDecision.Approve, cancellationToken);

    [HttpPost("{changeOrderId:guid}/reject")]
    public Task<IResult> RejectAsync(Guid projectId, Guid changeOrderId, CancellationToken cancellationToken) =>
        DecideAsync(projectId, changeOrderId, ChangeOrderDecision.Reject, cancellationToken);

    private async Task<IResult> DecideAsync(
        Guid projectId, Guid changeOrderId, ChangeOrderDecision decision, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await changeOrderService.DecideAsync(userId, projectId, changeOrderId, decision, cancellationToken);
        return result.Status switch
        {
            ChangeOrderDecisionStatus.Decided => Results.Ok(ChangeOrderDto.From(result.ChangeOrder!)),
            ChangeOrderDecisionStatus.NotPending => Results.Json(
                new { message = "Only change orders awaiting review or sign-off can be approved or rejected." },
                statusCode: StatusCodes.Status409Conflict),
            _ => Results.NotFound(),
        };
    }
}

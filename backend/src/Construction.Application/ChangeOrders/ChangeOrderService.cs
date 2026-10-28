using Construction.Application.Budget;
using Construction.Application.Common;
using Construction.Application.Dashboard;
using Construction.Application.Documents;
using Construction.Application.Projects;
using Construction.Domain.Entities;

namespace Construction.Application.ChangeOrders;

public class ChangeOrderService(
    IProjectRepository projects,
    IChangeOrderRepository changeOrders,
    IBudgetCategoryRepository categories,
    AttachmentUploader attachments,
    IUserDirectory userDirectory,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IChangeOrderService
{
    public async Task<PagedResult<ChangeOrderDto>?> SearchAsync(
        string ownerId, Guid projectId, ChangeOrderListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await changeOrders.SearchAsync(projectId, query, cancellationToken);
        var categoryNames = await CategoryNamesAsync(projectId, cancellationToken);
        return new PagedResult<ChangeOrderDto>(
            items.Select(c => ChangeOrderDto.From(c, CategoryName(categoryNames, c.CategoryId))).ToList(), totalCount,
            Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<ChangeOrderSummaryDto?> GetSummaryAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var totals = await changeOrders.GetTotalsAsync(projectId, cancellationToken);
        return new ChangeOrderSummaryDto(totals.Total, totals.Pending, totals.Approved);
    }

    public async Task<ChangeOrderDto?> GetAsync(
        string ownerId, Guid projectId, Guid changeOrderId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var changeOrder = await changeOrders.GetAsync(projectId, changeOrderId, cancellationToken);
        return changeOrder is null ? null : await ToDetailAsync(changeOrder, cancellationToken);
    }

    public async Task<ChangeOrderDto?> CreateAsync(
        string ownerId, Guid projectId, CreateChangeOrderCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        // A category from another project (or a deleted one) is dropped rather than tripping the FK — as TeamService does.
        var categoryNames = await CategoryNamesAsync(projectId, cancellationToken);
        var categoryId = command.CategoryId is { } requested && categoryNames.ContainsKey(requested) ? requested : (Guid?)null;

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var requestedByName = await userDirectory.GetDisplayNameAsync(ownerId, cancellationToken);
        var sequence = await changeOrders.NextSequenceAsync(projectId, cancellationToken);
        var changeOrder = ChangeOrder.Create(
            projectId, sequence, command.Description, command.Amount, command.RequestedDate, command.Reason, nowUtc,
            command.Scope, categoryId, command.ScheduleImpactDays, requestedByName);

        var uploads = new List<(ProjectDocument, TaskAttachment)>();
        foreach (var file in command.Attachments ?? [])
        {
            var document = await attachments.BuildAsync(ownerId, projectId, phaseId: null, file, nowUtc, cancellationToken);
            uploads.Add((document!, file));
        }

        await attachments.SaveWithAsync(uploads, async () =>
        {
            await changeOrders.AddAsync(changeOrder, cancellationToken);
            foreach (var (document, _) in uploads)
            {
                await changeOrders.AddAttachmentAsync(ChangeOrderAttachment.Create(changeOrder.Id, document.Id), cancellationToken);
            }
        }, cancellationToken);

        return ChangeOrderDto.From(
            changeOrder, CategoryName(categoryNames, categoryId), uploads.Select(u => ToAttachmentDto(u.Item1)).ToList());
    }

    public async Task<ChangeOrderDecisionResult> DecideAsync(
        string ownerId, Guid projectId, Guid changeOrderId, ChangeOrderDecision decision, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.NotFound);
        }

        var changeOrder = await changeOrders.GetAsync(projectId, changeOrderId, cancellationToken);
        if (changeOrder is null)
        {
            return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.NotFound);
        }

        if (!changeOrder.IsAwaitingDecision)
        {
            return new ChangeOrderDecisionResult(ChangeOrderDecisionStatus.NotPending);
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var byName = await userDirectory.GetDisplayNameAsync(ownerId, cancellationToken) ?? "Unknown";
        if (decision == ChangeOrderDecision.Approve)
        {
            changeOrder.Approve(byName, nowUtc);
        }
        else
        {
            changeOrder.Reject(byName, nowUtc);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new ChangeOrderDecisionResult(
            ChangeOrderDecisionStatus.Decided, await ToDetailAsync(changeOrder, cancellationToken));
    }

    private async Task<ChangeOrderDto> ToDetailAsync(ChangeOrder changeOrder, CancellationToken cancellationToken)
    {
        var categoryNames = await CategoryNamesAsync(changeOrder.ProjectId, cancellationToken);
        var documents = await changeOrders.ListAttachmentsAsync(changeOrder.Id, cancellationToken);
        return ChangeOrderDto.From(
            changeOrder, CategoryName(categoryNames, changeOrder.CategoryId), documents.Select(ToAttachmentDto).ToList());
    }

    private async Task<Dictionary<Guid, string>> CategoryNamesAsync(Guid projectId, CancellationToken cancellationToken) =>
        (await categories.ListByProjectAsync(projectId, cancellationToken)).ToDictionary(c => c.Id, c => c.Name);

    private static string? CategoryName(Dictionary<Guid, string> names, Guid? categoryId) =>
        categoryId is { } id && names.TryGetValue(id, out var name) ? name : null;

    private static ChangeOrderAttachmentDto ToAttachmentDto(ProjectDocument d) =>
        new(d.Id, d.OriginalFileName, d.SizeBytes, d.Format);
}

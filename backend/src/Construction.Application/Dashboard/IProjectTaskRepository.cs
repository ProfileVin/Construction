using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public interface IProjectTaskRepository
{
    Task<IReadOnlyList<ProjectTask>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<(IReadOnlyList<ProjectTask> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, TaskListQuery query, CancellationToken cancellationToken);

    /// <summary>Non-completed tasks per assignee name, keyed case-insensitively.</summary>
    Task<IReadOnlyDictionary<string, int>> CountOpenByAssigneeAsync(Guid projectId, CancellationToken cancellationToken);

    Task<ProjectTask?> GetAsync(Guid projectId, Guid taskId, CancellationToken cancellationToken);

    Task AddAsync(ProjectTask task, CancellationToken cancellationToken);

    /// <summary>Queues the task's removal; its <see cref="ProjectTaskAttachment"/> links cascade.</summary>
    void Remove(ProjectTask task);

    Task AddAttachmentAsync(ProjectTaskAttachment attachment, CancellationToken cancellationToken);

    /// <summary>Queues unlinking these documents from the task (the documents themselves are kept).</summary>
    Task RemoveAttachmentsAsync(Guid taskId, IReadOnlyCollection<Guid> documentIds, CancellationToken cancellationToken);

    /// <summary>The creation-time attachment (if any) plus every linked document, oldest first.</summary>
    Task<IReadOnlyList<ProjectDocument>> ListAttachmentsAsync(ProjectTask task, CancellationToken cancellationToken);
}

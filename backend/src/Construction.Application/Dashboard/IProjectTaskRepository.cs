using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public interface IProjectTaskRepository
{
    Task<IReadOnlyList<ProjectTask>> ListByProjectAsync(Guid projectId, CancellationToken cancellationToken);

    Task<(IReadOnlyList<ProjectTask> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, TaskListQuery query, CancellationToken cancellationToken);

    Task AddAsync(ProjectTask task, CancellationToken cancellationToken);
}

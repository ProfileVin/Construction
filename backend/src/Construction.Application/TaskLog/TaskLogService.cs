using Construction.Application.Common;
using Construction.Application.Dashboard;
using Construction.Application.Projects;
using Construction.Application.Schedule;

namespace Construction.Application.TaskLog;

public class TaskLogService(
    IProjectRepository projects,
    IProjectTaskRepository tasks,
    IConstructionPhaseRepository phases) : ITaskLogService
{
    public async Task<PagedResult<ProjectTaskDto>?> SearchTasksAsync(
        string ownerId, Guid projectId, TaskListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await tasks.SearchByProjectAsync(projectId, query, cancellationToken);
        var phaseNames = (await phases.ListByProjectAsync(projectId, cancellationToken))
            .ToDictionary(p => p.Id, p => p.Name);

        var dtos = items
            .Select(t => ProjectTaskDto.From(t, t.PhaseId is { } phaseId && phaseNames.TryGetValue(phaseId, out var name) ? name : null))
            .ToList();

        return new PagedResult<ProjectTaskDto>(dtos, totalCount, Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }
}

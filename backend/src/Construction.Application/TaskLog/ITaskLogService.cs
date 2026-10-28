using Construction.Application.Common;
using Construction.Application.Dashboard;

namespace Construction.Application.TaskLog;

public interface ITaskLogService
{
    Task<PagedResult<ProjectTaskDto>?> SearchTasksAsync(
        string ownerId, Guid projectId, TaskListQuery query, CancellationToken cancellationToken);
}

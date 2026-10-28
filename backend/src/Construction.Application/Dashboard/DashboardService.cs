using Construction.Application.Common;
using Construction.Application.Projects;
using Construction.Application.Schedule;
using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public class DashboardService(
    IProjectRepository projects,
    IProjectTaskRepository tasks,
    IConstructionPhaseRepository phases,
    IActivityLogRepository activityLog,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IDashboardService
{
    public async Task<IReadOnlyList<ProjectTaskDto>?> ListTasksAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var items = await tasks.ListByProjectAsync(projectId, cancellationToken);
        var phaseNames = (await phases.ListByProjectAsync(projectId, cancellationToken))
            .ToDictionary(p => p.Id, p => p.Name);

        return items
            .Select(t => ProjectTaskDto.From(t, t.PhaseId is { } phaseId && phaseNames.TryGetValue(phaseId, out var name) ? name : null))
            .ToList();
    }

    public async Task<ProjectTaskDto?> CreateTaskAsync(
        string ownerId,
        Guid projectId,
        CreateProjectTaskCommand command,
        CancellationToken cancellationToken,
        DateTime? occurredAtUtc = null)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var task = ProjectTask.Create(
            projectId, command.Title, command.AssigneeName, command.AssignedDate, command.Deadline,
            command.PhaseId, command.Status, nowUtc);

        await tasks.AddAsync(task, cancellationToken);
        await activityLog.AddAsync(
            ActivityLogEntry.Create(
                projectId,
                $"New task \"{task.Title}\" assigned to {task.AssigneeName}",
                task.Id,
                occurredAtUtc ?? nowUtc),
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        string? phaseName = null;
        if (task.PhaseId is { } taskPhaseId)
        {
            var phase = (await phases.ListByProjectAsync(projectId, cancellationToken))
                .FirstOrDefault(p => p.Id == taskPhaseId);
            phaseName = phase?.Name;
        }

        return ProjectTaskDto.From(task, phaseName);
    }

    public async Task<IReadOnlyList<ActivityLogEntryDto>?> ListActivityLogAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var entries = await activityLog.ListRecentByProjectAsync(projectId, 20, cancellationToken);
        return entries.Select(ActivityLogEntryDto.From).ToList();
    }
}

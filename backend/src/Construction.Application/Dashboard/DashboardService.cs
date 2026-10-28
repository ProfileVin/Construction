using Construction.Application.Common;
using Construction.Application.Documents;
using Construction.Application.Projects;
using Construction.Application.Schedule;
using Construction.Domain.Entities;

namespace Construction.Application.Dashboard;

public class DashboardService(
    IProjectRepository projects,
    IProjectTaskRepository tasks,
    IConstructionPhaseRepository phases,
    IActivityLogRepository activityLog,
    AttachmentUploader attachments,
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
        var attachment = await attachments.BuildAsync(ownerId, projectId, command.PhaseId, command.Attachment, nowUtc, cancellationToken);

        var task = ProjectTask.Create(
            projectId, command.Title, command.AssigneeName, command.AssignedDate, command.Deadline,
            command.PhaseId, command.Status, nowUtc, attachment?.Id);

        await attachments.SaveWithAsync(attachment, command.Attachment, async () =>
        {
            await tasks.AddAsync(task, cancellationToken);
            await AddLogEntryAsync(
                projectId, $"New task \"{task.Title}\" assigned to {task.AssigneeName}", task.Id,
                occurredAtUtc ?? nowUtc, cancellationToken);
        }, cancellationToken);

        string? phaseName = null;
        if (task.PhaseId is { } taskPhaseId)
        {
            var phase = (await phases.ListByProjectAsync(projectId, cancellationToken))
                .FirstOrDefault(p => p.Id == taskPhaseId);
            phaseName = phase?.Name;
        }

        return ProjectTaskDto.From(task, phaseName);
    }

    public async Task<TaskUpdateResult> UpdateTaskAsync(
        string ownerId, Guid projectId, Guid taskId, UpdateProjectTaskCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return new TaskUpdateResult(TaskUpdateStatus.NotFound);
        }

        var task = await tasks.GetAsync(projectId, taskId, cancellationToken);
        if (task is null)
        {
            return new TaskUpdateResult(TaskUpdateStatus.NotFound);
        }

        if (command.Deadline < task.AssignedDate)
        {
            return new TaskUpdateResult(TaskUpdateStatus.DeadlineBeforeAssigned);
        }

        // A phase from another project (or a deleted one) is dropped rather than tripping the FK — as TeamService does.
        var phaseNames = (await phases.ListByProjectAsync(projectId, cancellationToken)).ToDictionary(p => p.Id, p => p.Name);
        var phaseId = command.PhaseId is { } requested && phaseNames.ContainsKey(requested) ? requested : (Guid?)null;

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var previousStatus = task.Status;
        task.Update(command.Title, command.AssigneeName, command.Deadline, phaseId, command.Status, nowUtc);

        if (task.Status != previousStatus)
        {
            await AddLogEntryAsync(
                projectId, $"Task \"{task.Title}\" marked {StatusLabel(task.Status)}", task.Id, nowUtc, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new TaskUpdateResult(
            TaskUpdateStatus.Updated,
            ProjectTaskDto.From(task, phaseId is { } id ? phaseNames[id] : null));
    }

    public async Task<TaskUpdateResult> ExtendTaskDeadlineAsync(
        string ownerId, Guid projectId, Guid taskId, DateOnly newDeadline, string reason, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return new TaskUpdateResult(TaskUpdateStatus.NotFound);
        }

        var task = await tasks.GetAsync(projectId, taskId, cancellationToken);
        if (task is null)
        {
            return new TaskUpdateResult(TaskUpdateStatus.NotFound);
        }

        if (newDeadline <= task.Deadline)
        {
            return new TaskUpdateResult(TaskUpdateStatus.DeadlineNotLater);
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var previousDeadline = task.Deadline;
        task.Update(task.Title, task.AssigneeName, newDeadline, task.PhaseId, task.Status, nowUtc);

        var culture = System.Globalization.CultureInfo.InvariantCulture;
        await AddLogEntryAsync(
            projectId,
            $"Deadline extended from {previousDeadline.ToString("MMM d, yyyy", culture)} to {newDeadline.ToString("MMM d, yyyy", culture)} — {reason}",
            task.Id, nowUtc, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        string? phaseName = null;
        if (task.PhaseId is { } taskPhaseId)
        {
            var phase = (await phases.ListByProjectAsync(projectId, cancellationToken)).FirstOrDefault(p => p.Id == taskPhaseId);
            phaseName = phase?.Name;
        }

        return new TaskUpdateResult(TaskUpdateStatus.Updated, ProjectTaskDto.From(task, phaseName));
    }

    public async Task<IReadOnlyList<ActivityLogEntryDto>?> ListActivityLogAsync(
        string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var entries = await activityLog.ListRecentByProjectAsync(projectId, 20, cancellationToken);
        return await ToDtosAsync(projectId, entries, cancellationToken);
    }

    public async Task<IReadOnlyList<ActivityLogEntryDto>?> ListTaskActivityLogAsync(
        string ownerId, Guid projectId, Guid taskId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken)
            || await tasks.GetAsync(projectId, taskId, cancellationToken) is null)
        {
            return null;
        }

        var entries = await activityLog.ListByTaskAsync(projectId, taskId, cancellationToken);
        return await ToDtosAsync(projectId, entries, cancellationToken);
    }

    public async Task<ActivityLogEntryDto?> CreateActivityLogAsync(
        string ownerId, Guid projectId, CreateActivityLogCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var task = await tasks.GetAsync(projectId, command.TaskId, cancellationToken);
        if (task is null)
        {
            return null;
        }

        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var attachment = await attachments.BuildAsync(ownerId, projectId, task.PhaseId, command.Attachment, nowUtc, cancellationToken);

        ActivityLogEntry? entry = null;
        await attachments.SaveWithAsync(attachment, command.Attachment, async () =>
        {
            entry = await AddLogEntryAsync(
                projectId, command.Note, task.Id, nowUtc, cancellationToken,
                command.AssigneeName, command.Category, attachment?.Id);
        }, cancellationToken);

        return (await ToDtosAsync(projectId, [entry!], cancellationToken))[0];
    }

    public async Task<ActivityLogEntryDto?> UpdateActivityLogDescriptionAsync(
        string ownerId, Guid projectId, Guid entryId, string description, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var entry = await activityLog.GetAsync(projectId, entryId, cancellationToken);
        if (entry is null)
        {
            return null;
        }

        entry.UpdateDescription(description);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return (await ToDtosAsync(projectId, [entry], cancellationToken))[0];
    }

    /// <summary>Queues a numbered entry; the caller saves.</summary>
    private async Task<ActivityLogEntry> AddLogEntryAsync(
        Guid projectId,
        string description,
        Guid taskId,
        DateTime occurredAt,
        CancellationToken cancellationToken,
        string? assigneeName = null,
        string? category = null,
        Guid? attachmentDocumentId = null)
    {
        // Same per-project count + 1 sequence as invoice numbers (BudgetService).
        var sequence = await activityLog.CountByProjectAsync(projectId, cancellationToken) + 1;
        var entry = ActivityLogEntry.Create(
            projectId, $"LOG-{occurredAt.Year}-{sequence:000}", description, taskId, occurredAt,
            assigneeName, category, attachmentDocumentId);
        await activityLog.AddAsync(entry, cancellationToken);
        return entry;
    }

    private static string StatusLabel(ProjectTaskStatus status) => status switch
    {
        ProjectTaskStatus.InProgress => "In Progress",
        _ => status.ToString(),
    };

    /// <summary>Joins each entry to its task and that task's phase (numbered in start-date order).</summary>
    private async Task<IReadOnlyList<ActivityLogEntryDto>> ToDtosAsync(
        Guid projectId, IReadOnlyList<ActivityLogEntry> entries, CancellationToken cancellationToken)
    {
        var tasksById = (await tasks.ListByProjectAsync(projectId, cancellationToken)).ToDictionary(t => t.Id);
        var phaseList = await phases.ListByProjectAsync(projectId, cancellationToken);
        var phasesById = phaseList
            .Select((phase, index) => (phase, number: index + 1))
            .ToDictionary(p => p.phase.Id);

        return entries
            .Select(e =>
            {
                var task = e.ProjectTaskId is { } taskId ? tasksById.GetValueOrDefault(taskId) : null;
                if (task?.PhaseId is { } phaseId && phasesById.TryGetValue(phaseId, out var p))
                {
                    return ActivityLogEntryDto.From(e, task, p.phase, p.number);
                }

                return ActivityLogEntryDto.From(e, task, null, null);
            })
            .ToList();
    }
}

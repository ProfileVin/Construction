using Construction.Application.Common;
using Construction.Application.Dashboard;
using Construction.Application.Projects;
using Construction.Application.Schedule;
using Construction.Domain.Entities;

namespace Construction.Application.Team;

public class TeamService(
    IProjectRepository projects,
    ITeamMemberRepository members,
    IProjectTaskRepository tasks,
    IConstructionPhaseRepository phases,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : ITeamService
{
    public async Task<PagedResult<TeamMemberDto>?> SearchAsync(
        string ownerId, Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await members.SearchByProjectAsync(projectId, query, cancellationToken);
        var dtos = await ToDtosAsync(projectId, items, cancellationToken);

        return new PagedResult<TeamMemberDto>(
            dtos, totalCount, Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<IReadOnlyList<TeamMemberDto>?> ExportAsync(
        string ownerId, Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var items = await members.ListByProjectAsync(projectId, query, cancellationToken);
        return await ToDtosAsync(projectId, items, cancellationToken);
    }

    public async Task<IReadOnlyList<string>?> ListRolesAsync(string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        return await members.ListRolesAsync(projectId, cancellationToken);
    }

    public async Task<TeamMemberSaveResult> CreateAsync(
        string ownerId, Guid projectId, CreateTeamMemberCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return new TeamMemberSaveResult(TeamMemberSaveStatus.NotFound);
        }

        if (await members.EmailExistsAsync(projectId, command.Email, null, cancellationToken))
        {
            return new TeamMemberSaveResult(TeamMemberSaveStatus.DuplicateEmail);
        }

        var phaseNames = await GetPhaseNamesAsync(projectId, cancellationToken);
        var member = TeamMember.Create(
            projectId, command.FullName, command.RoleTitle, command.Specialty, command.Email,
            ValidPhaseId(phaseNames, command.PhaseId), command.Status, timeProvider.GetUtcNow().UtcDateTime);

        await members.AddAsync(member, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new TeamMemberSaveResult(TeamMemberSaveStatus.Saved, await ToDtoAsync(member, phaseNames, cancellationToken));
    }

    public async Task<TeamMemberSaveResult> UpdateAsync(
        string ownerId, Guid projectId, Guid memberId, UpdateTeamMemberCommand command, CancellationToken cancellationToken)
    {
        var member = await GetOwnedMemberAsync(ownerId, projectId, memberId, cancellationToken);
        if (member is null)
        {
            return new TeamMemberSaveResult(TeamMemberSaveStatus.NotFound);
        }

        if (await members.EmailExistsAsync(projectId, command.Email, memberId, cancellationToken))
        {
            return new TeamMemberSaveResult(TeamMemberSaveStatus.DuplicateEmail);
        }

        var phaseNames = await GetPhaseNamesAsync(projectId, cancellationToken);
        member.Update(
            command.FullName, command.RoleTitle, command.Specialty, command.Email,
            ValidPhaseId(phaseNames, command.PhaseId), timeProvider.GetUtcNow().UtcDateTime);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new TeamMemberSaveResult(TeamMemberSaveStatus.Saved, await ToDtoAsync(member, phaseNames, cancellationToken));
    }

    public async Task<TeamMemberDto?> SetStatusAsync(
        string ownerId, Guid projectId, Guid memberId, TeamMemberStatus status, CancellationToken cancellationToken)
    {
        var member = await GetOwnedMemberAsync(ownerId, projectId, memberId, cancellationToken);
        if (member is null)
        {
            return null;
        }

        member.SetStatus(status, timeProvider.GetUtcNow().UtcDateTime);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return await ToDtoAsync(member, await GetPhaseNamesAsync(projectId, cancellationToken), cancellationToken);
    }

    private async Task<TeamMember?> GetOwnedMemberAsync(
        string ownerId, Guid projectId, Guid memberId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        return await members.GetAsync(projectId, memberId, cancellationToken);
    }

    private async Task<IReadOnlyList<TeamMemberDto>> ToDtosAsync(
        Guid projectId, IReadOnlyList<TeamMember> items, CancellationToken cancellationToken)
    {
        var phaseNames = await GetPhaseNamesAsync(projectId, cancellationToken);
        var openTasks = await tasks.CountOpenByAssigneeAsync(projectId, cancellationToken);

        return items.Select(m => ToDto(m, phaseNames, openTasks)).ToList();
    }

    private async Task<TeamMemberDto> ToDtoAsync(
        TeamMember member, Dictionary<Guid, string> phaseNames, CancellationToken cancellationToken) =>
        ToDto(member, phaseNames, await tasks.CountOpenByAssigneeAsync(member.ProjectId, cancellationToken));

    // Tasks store a free-text assignee (ADR-0009), so "active tasks" matches by name.
    private static TeamMemberDto ToDto(
        TeamMember member, Dictionary<Guid, string> phaseNames, IReadOnlyDictionary<string, int> openTasks) =>
        TeamMemberDto.From(
            member,
            member.PhaseId is { } id && phaseNames.TryGetValue(id, out var name) ? name : null,
            openTasks.TryGetValue(member.FullName, out var count) ? count : 0);

    private async Task<Dictionary<Guid, string>> GetPhaseNamesAsync(Guid projectId, CancellationToken cancellationToken) =>
        (await phases.ListByProjectAsync(projectId, cancellationToken)).ToDictionary(p => p.Id, p => p.Name);

    private static Guid? ValidPhaseId(Dictionary<Guid, string> phaseNames, Guid? phaseId) =>
        phaseId is { } requested && phaseNames.ContainsKey(requested) ? requested : null;
}

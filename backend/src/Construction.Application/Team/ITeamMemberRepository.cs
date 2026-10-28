using Construction.Domain.Entities;

namespace Construction.Application.Team;

public interface ITeamMemberRepository
{
    Task<(IReadOnlyList<TeamMember> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken);

    /// <summary>All members matching the filters (page/pageSize ignored) — for export.</summary>
    Task<IReadOnlyList<TeamMember>> ListByProjectAsync(
        Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>> ListRolesAsync(Guid projectId, CancellationToken cancellationToken);

    Task<TeamMember?> GetAsync(Guid projectId, Guid memberId, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(Guid projectId, string email, Guid? exceptMemberId, CancellationToken cancellationToken);

    Task AddAsync(TeamMember member, CancellationToken cancellationToken);
}

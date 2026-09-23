using Construction.Application.Common;
using Construction.Domain.Entities;

namespace Construction.Application.Team;

public interface ITeamService
{
    Task<PagedResult<TeamMemberDto>?> SearchAsync(
        string ownerId, Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken);

    /// <summary>Every member matching the filters, unpaged — backs the CSV export.</summary>
    Task<IReadOnlyList<TeamMemberDto>?> ExportAsync(
        string ownerId, Guid projectId, TeamMemberListQuery query, CancellationToken cancellationToken);

    Task<IReadOnlyList<string>?> ListRolesAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<TeamMemberSaveResult> CreateAsync(
        string ownerId, Guid projectId, CreateTeamMemberCommand command, CancellationToken cancellationToken);

    Task<TeamMemberSaveResult> UpdateAsync(
        string ownerId, Guid projectId, Guid memberId, UpdateTeamMemberCommand command, CancellationToken cancellationToken);

    Task<TeamMemberDto?> SetStatusAsync(
        string ownerId, Guid projectId, Guid memberId, TeamMemberStatus status, CancellationToken cancellationToken);
}

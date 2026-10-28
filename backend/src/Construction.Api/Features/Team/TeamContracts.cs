using Construction.Domain.Entities;

namespace Construction.Api.Features.Team;

public record SaveTeamMemberRequest(
    string FullName,
    string RoleTitle,
    string? Specialty,
    string Email,
    Guid? PhaseId);

public record SetTeamMemberStatusRequest(TeamMemberStatus Status);

public record TeamMemberDto(
    Guid Id,
    Guid ProjectId,
    string FullName,
    string RoleTitle,
    string? Specialty,
    string Email,
    Guid? PhaseId,
    string? PhaseName,
    TeamMemberStatus Status,
    int ActiveTaskCount,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static TeamMemberDto From(Construction.Application.Team.TeamMemberDto m) => new(
        m.Id, m.ProjectId, m.FullName, m.RoleTitle, m.Specialty, m.Email, m.PhaseId, m.PhaseName,
        m.Status, m.ActiveTaskCount, m.CreatedAt, m.UpdatedAt);
}

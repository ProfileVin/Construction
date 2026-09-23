using Construction.Domain.Entities;

namespace Construction.Application.Team;

public record CreateTeamMemberCommand(
    string FullName,
    string RoleTitle,
    string? Specialty,
    string Email,
    Guid? PhaseId,
    TeamMemberStatus Status = TeamMemberStatus.Active);

public record UpdateTeamMemberCommand(
    string FullName,
    string RoleTitle,
    string? Specialty,
    string Email,
    Guid? PhaseId);

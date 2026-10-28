using Construction.Api.Common;
using Construction.Application.Team;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Team;

[ApiController]
[Route("api/projects/{projectId:guid}/team")]
[Authorize]
public class TeamController(ITeamService teamService) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> SearchAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] TeamMemberStatus? status,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new TeamMemberListQuery(search, role, status, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);
        var result = await teamService.SearchAsync(userId, projectId, query, cancellationToken);
        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<TeamMemberDto>(
            result.Items.Select(TeamMemberDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("roles")]
    public async Task<IResult> ListRolesAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var roles = await teamService.ListRolesAsync(userId, projectId, cancellationToken);
        return roles is null ? Results.NotFound() : Results.Ok(roles);
    }

    [HttpGet("export")]
    public async Task<IResult> ExportAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] TeamMemberStatus? status,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new TeamMemberListQuery(search, role, status, 1, int.MaxValue);
        var members = await teamService.ExportAsync(userId, projectId, query, cancellationToken);
        if (members is null)
        {
            return Results.NotFound();
        }

        return Results.File(TeamCsv.Write(members), "text/csv", "team-members.csv");
    }

    [HttpPost]
    public async Task<IResult> CreateAsync(
        Guid projectId, [FromBody] SaveTeamMemberRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var command = new CreateTeamMemberCommand(
            request.FullName, request.RoleTitle, request.Specialty, request.Email, request.PhaseId);
        var result = await teamService.CreateAsync(userId, projectId, command, cancellationToken);

        return ToResult(result, member => Results.Created(
            $"/api/projects/{projectId}/team/{member.Id}", TeamMemberDto.From(member)));
    }

    [HttpPut("{memberId:guid}")]
    public async Task<IResult> UpdateAsync(
        Guid projectId, Guid memberId, [FromBody] SaveTeamMemberRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var command = new UpdateTeamMemberCommand(
            request.FullName, request.RoleTitle, request.Specialty, request.Email, request.PhaseId);
        var result = await teamService.UpdateAsync(userId, projectId, memberId, command, cancellationToken);

        return ToResult(result, member => Results.Ok(TeamMemberDto.From(member)));
    }

    [HttpPut("{memberId:guid}/status")]
    public async Task<IResult> SetStatusAsync(
        Guid projectId, Guid memberId, [FromBody] SetTeamMemberStatusRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var member = await teamService.SetStatusAsync(userId, projectId, memberId, request.Status, cancellationToken);
        return member is null ? Results.NotFound() : Results.Ok(TeamMemberDto.From(member));
    }

    private static IResult ToResult(
        TeamMemberSaveResult result, Func<Construction.Application.Team.TeamMemberDto, IResult> onSaved) =>
        result.Status switch
        {
            TeamMemberSaveStatus.Saved => onSaved(result.Member!),
            TeamMemberSaveStatus.DuplicateEmail => Results.Json(
                new { message = "A member with this email is already on the project." },
                statusCode: StatusCodes.Status409Conflict),
            _ => Results.NotFound(),
        };
}

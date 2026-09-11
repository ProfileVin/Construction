using Construction.Api.Common;
using Construction.Application.Projects;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Projects;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController(IProjectService projectService) : ControllerBase
{
    [HttpGet]
    public async Task<IResult> ListAsync(CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var projects = await projectService.ListAsync(userId, cancellationToken);
        return Results.Ok(projects.Select(ProjectDto.From));
    }

    [HttpPost]
    public async Task<IResult> CreateAsync([FromBody] CreateProjectRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var command = new CreateProjectCommand(request.Name, request.Type, request.Status, request.Description);
        var project = await projectService.CreateAsync(userId, command, cancellationToken);

        return Results.Created($"/api/projects/{project.Id}", ProjectDto.From(project));
    }
}

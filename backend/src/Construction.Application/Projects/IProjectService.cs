namespace Construction.Application.Projects;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> ListAsync(string ownerId, CancellationToken cancellationToken);

    Task<ProjectDto> CreateAsync(string ownerId, CreateProjectCommand command, CancellationToken cancellationToken);
}

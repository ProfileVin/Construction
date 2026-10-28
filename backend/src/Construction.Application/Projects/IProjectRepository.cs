using Construction.Domain.Entities;

namespace Construction.Application.Projects;

public interface IProjectRepository
{
    Task<IReadOnlyList<Project>> ListByOwnerAsync(string ownerId, CancellationToken cancellationToken);

    Task<bool> ExistsForOwnerAsync(Guid projectId, string ownerId, CancellationToken cancellationToken);

    Task<Project?> GetForOwnerAsync(Guid projectId, string ownerId, CancellationToken cancellationToken);

    Task AddAsync(Project project, CancellationToken cancellationToken);
}

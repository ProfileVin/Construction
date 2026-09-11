using Construction.Application.Common;
using Construction.Domain.Entities;

namespace Construction.Application.Projects;

public class ProjectService(
    IProjectRepository projects,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IProjectService
{
    public async Task<IReadOnlyList<ProjectDto>> ListAsync(string ownerId, CancellationToken cancellationToken)
    {
        var items = await projects.ListByOwnerAsync(ownerId, cancellationToken);
        return items.Select(ProjectDto.From).ToList();
    }

    public async Task<ProjectDto> CreateAsync(string ownerId, CreateProjectCommand command, CancellationToken cancellationToken)
    {
        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;
        var project = Project.Create(ownerId, command.Name, command.Type, command.Status, command.Description, nowUtc);

        if (command.BudgetTotal is not null && command.TotalSpent is not null)
        {
            project.SetBudget(command.BudgetTotal.Value, command.TotalSpent.Value, nowUtc);
        }

        await projects.AddAsync(project, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ProjectDto.From(project);
    }
}

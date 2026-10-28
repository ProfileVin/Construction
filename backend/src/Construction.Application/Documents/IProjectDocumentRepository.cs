using Construction.Domain.Entities;

namespace Construction.Application.Documents;

public interface IProjectDocumentRepository
{
    Task<(IReadOnlyList<ProjectDocument> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, DocumentListQuery query, CancellationToken cancellationToken);

    Task<IReadOnlyDictionary<DocumentFormat, int>> CountByFormatAsync(Guid projectId, CancellationToken cancellationToken);

    Task<ProjectDocument?> GetAsync(Guid projectId, Guid documentId, CancellationToken cancellationToken);

    Task AddAsync(ProjectDocument document, CancellationToken cancellationToken);
}

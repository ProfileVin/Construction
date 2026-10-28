using Construction.Application.Common;

namespace Construction.Application.Documents;

public interface IDocumentService
{
    Task<PagedResult<ProjectDocumentDto>?> SearchAsync(
        string ownerId, Guid projectId, DocumentListQuery query, CancellationToken cancellationToken);

    Task<DocumentCountsDto?> GetCountsAsync(string ownerId, Guid projectId, CancellationToken cancellationToken);

    Task<ProjectDocumentDto?> UploadAsync(
        string ownerId, Guid projectId, UploadDocumentCommand command, CancellationToken cancellationToken);

    Task<DocumentContent?> OpenAsync(string ownerId, Guid projectId, Guid documentId, CancellationToken cancellationToken);
}

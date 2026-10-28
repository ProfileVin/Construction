using Construction.Application.Common;
using Construction.Application.Projects;
using Construction.Application.Schedule;
using Construction.Domain.Entities;

namespace Construction.Application.Documents;

public class DocumentService(
    IProjectRepository projects,
    IProjectDocumentRepository documents,
    IConstructionPhaseRepository phases,
    IFileStorage fileStorage,
    IUserDirectory userDirectory,
    IUnitOfWork unitOfWork,
    TimeProvider timeProvider) : IDocumentService
{
    public async Task<PagedResult<ProjectDocumentDto>?> SearchAsync(
        string ownerId, Guid projectId, DocumentListQuery query, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var (items, totalCount) = await documents.SearchByProjectAsync(projectId, query, cancellationToken);
        var phaseNames = await GetPhaseNamesAsync(projectId, cancellationToken);

        var dtos = items.Select(d => ProjectDocumentDto.From(d, PhaseName(phaseNames, d.PhaseId))).ToList();

        return new PagedResult<ProjectDocumentDto>(
            dtos, totalCount, Math.Max(1, query.Page), Math.Clamp(query.PageSize, 1, 100));
    }

    public async Task<DocumentCountsDto?> GetCountsAsync(string ownerId, Guid projectId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var counts = await documents.CountByFormatAsync(projectId, cancellationToken);
        int Count(DocumentFormat format) => counts.TryGetValue(format, out var n) ? n : 0;

        return new DocumentCountsDto(
            counts.Values.Sum(),
            Count(DocumentFormat.Image),
            Count(DocumentFormat.Pdf),
            Count(DocumentFormat.Word),
            Count(DocumentFormat.Spreadsheet),
            Count(DocumentFormat.Other));
    }

    public async Task<ProjectDocumentDto?> UploadAsync(
        string ownerId, Guid projectId, UploadDocumentCommand command, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var phaseNames = await GetPhaseNamesAsync(projectId, cancellationToken);
        var phaseId = command.PhaseId is { } requested && phaseNames.ContainsKey(requested) ? requested : (Guid?)null;

        var documentId = Guid.NewGuid();
        var extension = Path.GetExtension(command.FileName).ToLowerInvariant();
        var storageKey = $"{projectId:N}/{documentId:N}{extension}";
        var uploadedByName = await userDirectory.GetDisplayNameAsync(ownerId, cancellationToken) ?? "Unknown";
        var nowUtc = timeProvider.GetUtcNow().UtcDateTime;

        var document = ProjectDocument.Create(
            documentId, projectId, phaseId, command.Name, command.FileName, command.ContentType,
            command.SizeBytes, storageKey, ownerId, uploadedByName, nowUtc);

        await fileStorage.SaveAsync(storageKey, command.Content, cancellationToken);
        try
        {
            await documents.AddAsync(document, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await fileStorage.DeleteAsync(storageKey, CancellationToken.None);
            throw;
        }

        return ProjectDocumentDto.From(document, PhaseName(phaseNames, document.PhaseId));
    }

    public async Task<DocumentContent?> OpenAsync(
        string ownerId, Guid projectId, Guid documentId, CancellationToken cancellationToken)
    {
        if (!await projects.ExistsForOwnerAsync(projectId, ownerId, cancellationToken))
        {
            return null;
        }

        var document = await documents.GetAsync(projectId, documentId, cancellationToken);
        if (document is null)
        {
            return null;
        }

        var stream = await fileStorage.OpenReadAsync(document.StorageKey, cancellationToken);
        if (stream is null)
        {
            return null;
        }

        var phaseNames = await GetPhaseNamesAsync(projectId, cancellationToken);
        return new DocumentContent(ProjectDocumentDto.From(document, PhaseName(phaseNames, document.PhaseId)), stream);
    }

    private async Task<Dictionary<Guid, string>> GetPhaseNamesAsync(Guid projectId, CancellationToken cancellationToken) =>
        (await phases.ListByProjectAsync(projectId, cancellationToken)).ToDictionary(p => p.Id, p => p.Name);

    private static string? PhaseName(Dictionary<Guid, string> phaseNames, Guid? phaseId) =>
        phaseId is { } id && phaseNames.TryGetValue(id, out var name) ? name : null;
}

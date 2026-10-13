using Construction.Application.Common;
using Construction.Application.Dashboard;
using Construction.Domain.Entities;

namespace Construction.Application.Documents;

/// <summary>
/// Stores a file sent with another record (a task or log attachment, an invoice receipt) as a
/// <see cref="ProjectDocument"/>, saved in the same unit of work as that record.
/// </summary>
public class AttachmentUploader(
    IProjectDocumentRepository documents,
    IFileStorage fileStorage,
    IUserDirectory userDirectory,
    IUnitOfWork unitOfWork)
{
    /// <summary>The document row for an optional upload (not yet stored or saved).</summary>
    public async Task<ProjectDocument?> BuildAsync(
        string ownerId, Guid projectId, Guid? phaseId, TaskAttachment? file, DateTime nowUtc, CancellationToken cancellationToken)
    {
        if (file is null)
        {
            return null;
        }

        var documentId = Guid.NewGuid();
        var uploadedByName = await userDirectory.GetDisplayNameAsync(ownerId, cancellationToken) ?? "Unknown";
        return ProjectDocument.Create(
            documentId, projectId, phaseId, name: null, file.FileName, file.ContentType, file.SizeBytes,
            DocumentUploadRules.StorageKeyFor(projectId, documentId, file.FileName), ownerId, uploadedByName, nowUtc);
    }

    /// <summary>
    /// Writes the file, queues its document row plus whatever <paramref name="addRows"/> adds, and saves —
    /// deleting the file again if the save fails.
    /// </summary>
    public async Task SaveWithAsync(
        ProjectDocument? document, TaskAttachment? file, Func<Task> addRows, CancellationToken cancellationToken)
    {
        if (document is not null)
        {
            await fileStorage.SaveAsync(document.StorageKey, file!.Content, cancellationToken);
        }

        try
        {
            if (document is not null)
            {
                await documents.AddAsync(document, cancellationToken);
            }

            await addRows();
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch when (document is not null)
        {
            await fileStorage.DeleteAsync(document.StorageKey, CancellationToken.None);
            throw;
        }
    }
}

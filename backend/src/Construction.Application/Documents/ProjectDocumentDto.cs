using Construction.Domain.Entities;

namespace Construction.Application.Documents;

public record ProjectDocumentDto(
    Guid Id,
    Guid ProjectId,
    Guid? PhaseId,
    string? PhaseName,
    string Name,
    string OriginalFileName,
    string ContentType,
    long SizeBytes,
    DocumentFormat Format,
    string UploadedByName,
    DateTime CreatedAt,
    DateTime UpdatedAt)
{
    public static ProjectDocumentDto From(ProjectDocument d, string? phaseName) => new(
        d.Id, d.ProjectId, d.PhaseId, phaseName, d.Name, d.OriginalFileName, d.ContentType,
        d.SizeBytes, d.Format, d.UploadedByName, d.CreatedAt, d.UpdatedAt);
}

public record DocumentCountsDto(int All, int Image, int Pdf, int Word, int Spreadsheet, int Other);

public record DocumentContent(ProjectDocumentDto Document, Stream Content);

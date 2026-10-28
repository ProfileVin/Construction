using Construction.Domain.Entities;
using Construction.Application.Documents;

namespace Construction.Api.Features.Documents;

public class UploadDocumentRequest
{
    public IFormFile? File { get; set; }

    public string? Name { get; set; }

    public Guid? PhaseId { get; set; }
}

public record DocumentDto(
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
    public static DocumentDto From(ProjectDocumentDto d) => new(
        d.Id, d.ProjectId, d.PhaseId, d.PhaseName, d.Name, d.OriginalFileName, d.ContentType,
        d.SizeBytes, d.Format, d.UploadedByName, d.CreatedAt, d.UpdatedAt);
}

public record DocumentCountsResponse(int All, int Image, int Pdf, int Word, int Spreadsheet, int Other)
{
    public static DocumentCountsResponse From(DocumentCountsDto c) => new(
        c.All, c.Image, c.Pdf, c.Word, c.Spreadsheet, c.Other);
}

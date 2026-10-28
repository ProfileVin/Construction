namespace Construction.Application.Documents;

public record UploadDocumentCommand(
    string? Name,
    Guid? PhaseId,
    string FileName,
    string ContentType,
    long SizeBytes,
    Stream Content);

namespace Construction.Domain.Entities;

public enum DocumentFormat
{
    Image,
    Pdf,
    Word,
    Spreadsheet,
    Other,
}

public class ProjectDocument
{
    public Guid Id { get; private set; }
    public Guid ProjectId { get; private set; }
    public Guid? PhaseId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string OriginalFileName { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public string Extension { get; private set; } = string.Empty;
    public long SizeBytes { get; private set; }
    public DocumentFormat Format { get; private set; }
    public string StorageKey { get; private set; } = string.Empty;
    public string UploadedByUserId { get; private set; } = string.Empty;
    public string UploadedByName { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ProjectDocument()
    {
    }

    public static ProjectDocument Create(
        Guid id,
        Guid projectId,
        Guid? phaseId,
        string? name,
        string originalFileName,
        string contentType,
        long sizeBytes,
        string storageKey,
        string uploadedByUserId,
        string uploadedByName,
        DateTime nowUtc)
    {
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            throw new ArgumentException("File name is required.", nameof(originalFileName));
        }

        if (sizeBytes <= 0)
        {
            throw new ArgumentException("File must not be empty.", nameof(sizeBytes));
        }

        if (string.IsNullOrWhiteSpace(storageKey))
        {
            throw new ArgumentException("Storage key is required.", nameof(storageKey));
        }

        var fileName = Path.GetFileName(originalFileName.Trim());
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        var displayName = string.IsNullOrWhiteSpace(name) ? Path.GetFileNameWithoutExtension(fileName) : name.Trim();

        return new ProjectDocument
        {
            Id = id,
            ProjectId = projectId,
            PhaseId = phaseId,
            Name = displayName,
            OriginalFileName = fileName,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            Extension = extension,
            SizeBytes = sizeBytes,
            Format = DocumentFormatResolver.FromExtension(extension),
            StorageKey = storageKey,
            UploadedByUserId = uploadedByUserId,
            UploadedByName = uploadedByName,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc,
        };
    }
}

public static class DocumentFormatResolver
{
    private static readonly HashSet<string> ImageExtensions =
        [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".tif", ".tiff", ".bmp"];

    private static readonly HashSet<string> WordExtensions = [".doc", ".docx", ".odt", ".rtf"];

    private static readonly HashSet<string> SpreadsheetExtensions = [".xls", ".xlsx", ".csv", ".ods"];

    public static DocumentFormat FromExtension(string extension)
    {
        var ext = extension.ToLowerInvariant();
        if (ImageExtensions.Contains(ext))
        {
            return DocumentFormat.Image;
        }

        if (ext == ".pdf")
        {
            return DocumentFormat.Pdf;
        }

        if (WordExtensions.Contains(ext))
        {
            return DocumentFormat.Word;
        }

        return SpreadsheetExtensions.Contains(ext) ? DocumentFormat.Spreadsheet : DocumentFormat.Other;
    }
}

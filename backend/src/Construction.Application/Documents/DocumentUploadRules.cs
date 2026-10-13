namespace Construction.Application.Documents;

public static class DocumentUploadRules
{
    public const long MaxSizeBytes = 100L * 1024 * 1024;

    /// <summary>Files attached from the "Assign New Task" dialog are stored as documents but capped lower.</summary>
    public const long TaskAttachmentMaxSizeBytes = 25L * 1024 * 1024;

    public static readonly IReadOnlySet<string> AllowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".tif", ".tiff", ".bmp",
        ".pdf",
        ".doc", ".docx", ".odt", ".rtf",
        ".xls", ".xlsx", ".csv", ".ods",
        ".dwg", ".dxf", ".txt", ".zip",
    };

    public static bool IsAllowedExtension(string fileName) =>
        AllowedExtensions.Contains(Path.GetExtension(fileName));

    /// <summary>Server-generated storage key — never derived from user input beyond the extension.</summary>
    public static string StorageKeyFor(Guid projectId, Guid documentId, string fileName) =>
        $"{projectId:N}/{documentId:N}{Path.GetExtension(fileName).ToLowerInvariant()}";
}

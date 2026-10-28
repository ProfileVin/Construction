using Construction.Api.Common;
using Construction.Application.Documents;
using Construction.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Construction.Api.Features.Documents;

[ApiController]
[Route("api/projects/{projectId:guid}/documents")]
[Authorize]
public class DocumentsController(IDocumentService documentService) : ControllerBase
{
    // Multipart framing adds a little on top of the file itself.
    private const long MaxRequestBytes = DocumentUploadRules.MaxSizeBytes + (1024 * 1024);

    [HttpGet]
    public async Task<IResult> SearchAsync(
        Guid projectId,
        [FromQuery] string? search,
        [FromQuery] DocumentFormat? format,
        [FromQuery] int page,
        [FromQuery] int pageSize,
        CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = new DocumentListQuery(search, format, page <= 0 ? 1 : page, pageSize <= 0 ? 8 : pageSize);
        var result = await documentService.SearchAsync(userId, projectId, query, cancellationToken);
        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.Ok(new PagedResponse<DocumentDto>(
            result.Items.Select(DocumentDto.From).ToList(), result.TotalCount, result.Page, result.PageSize));
    }

    [HttpGet("counts")]
    public async Task<IResult> GetCountsAsync(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var counts = await documentService.GetCountsAsync(userId, projectId, cancellationToken);
        return counts is null ? Results.NotFound() : Results.Ok(DocumentCountsResponse.From(counts));
    }

    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IResult> UploadAsync(
        Guid projectId, [FromForm] UploadDocumentRequest request, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        // Non-null is guaranteed by UploadDocumentRequestValidator (run by FluentValidationFilter).
        var file = request.File!;
        await using var content = file.OpenReadStream();

        var command = new UploadDocumentCommand(
            request.Name, request.PhaseId, file.FileName, file.ContentType, file.Length, content);
        var document = await documentService.UploadAsync(userId, projectId, command, cancellationToken);

        return document is null
            ? Results.NotFound()
            : Results.Created($"/api/projects/{projectId}/documents/{document.Id}", DocumentDto.From(document));
    }

    [HttpGet("{documentId:guid}/content")]
    public async Task<IResult> GetContentAsync(
        Guid projectId, Guid documentId, [FromQuery] bool download, CancellationToken cancellationToken)
    {
        var userId = User.GetUserId();
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var result = await documentService.OpenAsync(userId, projectId, documentId, cancellationToken);
        if (result is null)
        {
            return Results.NotFound();
        }

        return Results.File(
            result.Content,
            result.Document.ContentType,
            fileDownloadName: download ? result.Document.OriginalFileName : null,
            lastModified: result.Document.UpdatedAt,
            enableRangeProcessing: true);
    }
}

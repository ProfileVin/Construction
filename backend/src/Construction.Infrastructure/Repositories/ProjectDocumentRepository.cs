using Construction.Application.Documents;
using Construction.Domain.Entities;
using Construction.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Repositories;

public class ProjectDocumentRepository(AppDbContext db) : IProjectDocumentRepository
{
    public async Task<(IReadOnlyList<ProjectDocument> Items, int TotalCount)> SearchByProjectAsync(
        Guid projectId, DocumentListQuery query, CancellationToken cancellationToken)
    {
        var q = db.ProjectDocuments.Where(d => d.ProjectId == projectId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            q = q.Where(d => d.Name.Contains(term) || d.OriginalFileName.Contains(term));
        }

        if (query.Format is { } format)
        {
            q = q.Where(d => d.Format == format);
        }

        var totalCount = await q.CountAsync(cancellationToken);

        var safePage = Math.Max(1, query.Page);
        var safePageSize = Math.Clamp(query.PageSize, 1, 100);

        var items = await q
            .OrderByDescending(d => d.UpdatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<IReadOnlyDictionary<DocumentFormat, int>> CountByFormatAsync(
        Guid projectId, CancellationToken cancellationToken)
    {
        return await db.ProjectDocuments
            .Where(d => d.ProjectId == projectId)
            .GroupBy(d => d.Format)
            .Select(g => new { Format = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Format, x => x.Count, cancellationToken);
    }

    public async Task<ProjectDocument?> GetAsync(Guid projectId, Guid documentId, CancellationToken cancellationToken)
    {
        return await db.ProjectDocuments
            .FirstOrDefaultAsync(d => d.ProjectId == projectId && d.Id == documentId, cancellationToken);
    }

    public Task AddAsync(ProjectDocument document, CancellationToken cancellationToken)
    {
        db.ProjectDocuments.Add(document);
        return Task.CompletedTask;
    }
}

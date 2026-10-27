using Construction.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();

    public DbSet<ConstructionPhase> ConstructionPhases => Set<ConstructionPhase>();

    public DbSet<BudgetCategory> BudgetCategories => Set<BudgetCategory>();

    public DbSet<Invoice> Invoices => Set<Invoice>();

    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();

    public DbSet<PurchaseOrderLineItem> PurchaseOrderLineItems => Set<PurchaseOrderLineItem>();

    public DbSet<ChangeOrder> ChangeOrders => Set<ChangeOrder>();

    public DbSet<ProjectDocument> ProjectDocuments => Set<ProjectDocument>();

    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();

    public DbSet<ActivityLogEntry> ActivityLogEntries => Set<ActivityLogEntry>();

    public DbSet<LookupOption> LookupOptions => Set<LookupOption>();

    public DbSet<Currency> Currencies => Set<Currency>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Project>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200).IsRequired();
            entity.Property(p => p.Description).HasMaxLength(2000);
            entity.Property(p => p.Type).HasConversion<string>().HasMaxLength(40);
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(p => p.BudgetTotal).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(p => p.TotalSpent).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.HasIndex(p => p.OwnerId);
            entity.HasOne<ApplicationUser>()
                .WithMany()
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProjectTask>(entity =>
        {
            entity.Property(t => t.Title).HasMaxLength(1000).IsRequired();
            entity.Property(t => t.AssigneeName).HasMaxLength(200).IsRequired();
            entity.Property(t => t.AssignedDate).HasColumnType("date");
            entity.Property(t => t.Deadline).HasColumnType("date");
            entity.Property(t => t.Status).HasConversion<string>().HasMaxLength(40)
                .HasDefaultValue(ProjectTaskStatus.Upcoming);
            entity.HasIndex(t => t.ProjectId);
            entity.HasIndex(t => t.PhaseId);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ConstructionPhase>()
                .WithMany()
                .HasForeignKey(t => t.PhaseId)
                .OnDelete(DeleteBehavior.ClientSetNull);
            // Restrict: a second cascade path from Project (via ProjectDocuments) isn't allowed on SQL Server.
            entity.HasIndex(t => t.AttachmentDocumentId);
            entity.HasOne<ProjectDocument>()
                .WithMany()
                .HasForeignKey(t => t.AttachmentDocumentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<ConstructionPhase>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200).IsRequired();
            entity.Property(p => p.CheckpointLabel).HasMaxLength(300);
            entity.Property(p => p.StartDate).HasColumnType("date");
            entity.Property(p => p.EndDate).HasColumnType("date");
            entity.Property(p => p.Status).HasConversion<string>().HasMaxLength(40);
            entity.HasIndex(p => p.ProjectId);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(p => p.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<BudgetCategory>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(200).IsRequired();
            entity.Property(c => c.AllocatedAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.Property(c => c.SpentAmount).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
            entity.HasIndex(c => c.ProjectId);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Invoice>(entity =>
        {
            entity.Property(i => i.InvoiceNumber).HasMaxLength(40).IsRequired();
            entity.Property(i => i.VendorName).HasMaxLength(200).IsRequired();
            entity.Property(i => i.Amount).HasColumnType("decimal(18,2)");
            entity.Property(i => i.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(i => i.IssuedDate).HasColumnType("date");
            entity.Property(i => i.Notes).HasMaxLength(2000);
            entity.HasIndex(i => i.ProjectId);
            entity.HasIndex(i => i.CategoryId);
            // Restrict for the same multiple-cascade-path reason as ProjectTask.AttachmentDocumentId.
            entity.HasIndex(i => i.ReceiptDocumentId);
            entity.HasOne<ProjectDocument>()
                .WithMany()
                .HasForeignKey(i => i.ReceiptDocumentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<BudgetCategory>()
                .WithMany()
                .HasForeignKey(i => i.CategoryId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        builder.Entity<PurchaseOrder>(entity =>
        {
            entity.Property(o => o.PoNumber).HasMaxLength(40).IsRequired();
            entity.Property(o => o.VendorName).HasMaxLength(200).IsRequired();
            entity.Property(o => o.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(o => o.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(o => o.IssuedDate).HasColumnType("date");
            entity.Property(o => o.DeliveryDate).HasColumnType("date");
            entity.Property(o => o.Notes).HasMaxLength(2000);
            entity.HasIndex(o => new { o.ProjectId, o.Sequence }).IsUnique();
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(o => o.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            // Lines cascade from the PO only (no ProjectId) — a second path from Project would be rejected by SQL Server.
            entity.HasMany(o => o.LineItems)
                .WithOne()
                .HasForeignKey(l => l.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Navigation(o => o.LineItems).UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        builder.Entity<PurchaseOrderLineItem>(entity =>
        {
            entity.Property(l => l.Description).HasMaxLength(200).IsRequired();
            entity.Property(l => l.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Ignore(l => l.LineTotal);
        });

        builder.Entity<ChangeOrder>(entity =>
        {
            entity.Property(c => c.CoNumber).HasMaxLength(40).IsRequired();
            entity.Property(c => c.Description).HasMaxLength(500).IsRequired();
            entity.Property(c => c.Amount).HasColumnType("decimal(18,2)");
            entity.Property(c => c.Status).HasConversion<string>().HasMaxLength(40);
            entity.Property(c => c.RequestedDate).HasColumnType("date");
            entity.Property(c => c.Reason).HasMaxLength(2000);
            entity.HasIndex(c => new { c.ProjectId, c.Sequence }).IsUnique();
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(c => c.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ProjectDocument>(entity =>
        {
            entity.Property(d => d.Name).HasMaxLength(260).IsRequired();
            entity.Property(d => d.OriginalFileName).HasMaxLength(260).IsRequired();
            entity.Property(d => d.ContentType).HasMaxLength(200).IsRequired();
            entity.Property(d => d.Extension).HasMaxLength(20);
            entity.Property(d => d.Format).HasConversion<string>().HasMaxLength(40);
            entity.Property(d => d.StorageKey).HasMaxLength(300).IsRequired();
            entity.Property(d => d.UploadedByUserId).HasMaxLength(450).IsRequired();
            entity.Property(d => d.UploadedByName).HasMaxLength(200).IsRequired();
            entity.HasIndex(d => d.ProjectId);
            entity.HasIndex(d => d.PhaseId);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ConstructionPhase>()
                .WithMany()
                .HasForeignKey(d => d.PhaseId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        builder.Entity<TeamMember>(entity =>
        {
            entity.Property(m => m.FullName).HasMaxLength(200).IsRequired();
            entity.Property(m => m.RoleTitle).HasMaxLength(200).IsRequired();
            entity.Property(m => m.Specialty).HasMaxLength(200);
            entity.Property(m => m.Email).HasMaxLength(256).IsRequired();
            entity.Property(m => m.Status).HasConversion<string>().HasMaxLength(40);
            entity.HasIndex(m => new { m.ProjectId, m.Email }).IsUnique();
            entity.HasIndex(m => m.PhaseId);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(m => m.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ConstructionPhase>()
                .WithMany()
                .HasForeignKey(m => m.PhaseId)
                .OnDelete(DeleteBehavior.ClientSetNull);
        });

        builder.Entity<ActivityLogEntry>(entity =>
        {
            // 2000: the auto text embeds the task text (≤ 1000 since FEAT-018) and is user-editable (BUG-012).
            entity.Property(e => e.Description).HasMaxLength(2000).IsRequired();
            entity.Property(e => e.LogNumber).HasMaxLength(40).IsRequired();
            entity.Property(e => e.AssigneeName).HasMaxLength(200);
            entity.Property(e => e.Category).HasMaxLength(40);
            entity.HasIndex(e => e.ProjectId);
            entity.HasIndex(e => e.OccurredAt);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<ProjectTask>()
                .WithMany()
                .HasForeignKey(e => e.ProjectTaskId)
                .OnDelete(DeleteBehavior.Restrict);
            // Restrict for the same multiple-cascade-path reason as ProjectTask.AttachmentDocumentId.
            entity.HasIndex(e => e.AttachmentDocumentId);
            entity.HasOne<ProjectDocument>()
                .WithMany()
                .HasForeignKey(e => e.AttachmentDocumentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<LookupOption>(entity =>
        {
            entity.Property(o => o.Category).HasMaxLength(40).IsRequired();
            entity.Property(o => o.Value).HasMaxLength(100).IsRequired();
            entity.Property(o => o.Label).HasMaxLength(200).IsRequired();
            entity.Property(o => o.Hint).HasMaxLength(400);
            entity.HasIndex(o => new { o.Category, o.Value }).IsUnique();
            entity.HasData(ReferenceSeedData.LookupOptions);
        });

        builder.Entity<Currency>(entity =>
        {
            entity.Property(c => c.Code).HasMaxLength(3).IsRequired();
            entity.Property(c => c.Name).HasMaxLength(100).IsRequired();
            entity.Property(c => c.Symbol).HasMaxLength(8).IsRequired();
            entity.HasIndex(c => c.Code).IsUnique();
            entity.HasData(ReferenceSeedData.Currencies);
        });
    }
}

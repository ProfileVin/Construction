using Construction.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Construction.Infrastructure.Persistence;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<ApplicationUser>(options)
{
    public DbSet<Project> Projects => Set<Project>();

    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();

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
            entity.Property(t => t.Title).HasMaxLength(200).IsRequired();
            entity.Property(t => t.AssigneeName).HasMaxLength(200).IsRequired();
            entity.Property(t => t.AssignedDate).HasColumnType("date");
            entity.Property(t => t.Deadline).HasColumnType("date");
            entity.HasIndex(t => t.ProjectId);
            entity.HasOne<Project>()
                .WithMany()
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ActivityLogEntry>(entity =>
        {
            entity.Property(e => e.Description).HasMaxLength(500).IsRequired();
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

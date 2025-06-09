// Data/TaskContext.cs - Updated with new fields
using Microsoft.EntityFrameworkCore;
using TaskManagement.Models;

namespace TaskManagement.Data
{
    public class TaskContext : DbContext
    {
        public TaskContext(DbContextOptions<TaskContext> options) : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<Resource> Resources { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure TaskItem entity
            modelBuilder.Entity<TaskItem>(entity =>
            {
                entity.ToTable("tasks");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
                entity.Property(e => e.AssignedTo).HasColumnName("assigned_to").HasMaxLength(100).IsRequired();
                entity.Property(e => e.WorkRequired).HasColumnName("work_required");
                entity.Property(e => e.Deadline).HasColumnName("deadline");
                entity.Property(e => e.PercentCompleted).HasColumnName("percent_completed");
                entity.Property(e => e.GroupTask).HasColumnName("group_task").HasMaxLength(100).IsRequired();

                // New fields
                entity.Property(e => e.Customer).HasColumnName("customer").HasMaxLength(150);
                entity.Property(e => e.PhoneNo).HasColumnName("phone_no").HasMaxLength(20);
                entity.Property(e => e.SportPlayed).HasColumnName("sport_played").HasMaxLength(100);
                entity.Property(e => e.Updates).HasColumnName("updates").HasMaxLength(1000);
                entity.Property(e => e.CreatedAt).HasColumnName("created_at");
                entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

                // Store enum as string to avoid conversion issues
                entity.Property(e => e.Status)
                    .HasColumnName("status")
                    .HasConversion(
                        v => v.ToString(),
                        v => Enum.Parse<TaskItemStatus>(v)
                    );

                // Add indexes for better performance
                entity.HasIndex(e => e.AssignedTo);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.GroupTask);
                entity.HasIndex(e => e.Customer);
                entity.HasIndex(e => e.SportPlayed);
                entity.HasIndex(e => e.Deadline);
            });

            // Configure Resource entity
            modelBuilder.Entity<Resource>(entity =>
            {
                entity.ToTable("resources");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id).HasColumnName("id");
                entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
                entity.Property(e => e.WorkloadHours).HasColumnName("workload_hours");

                // Store enum as string for consistency
                entity.Property(e => e.Status)
                    .HasColumnName("status")
                    .HasConversion(
                        v => v.ToString(),
                        v => Enum.Parse<ResourceStatus>(v)
                    );

                entity.HasIndex(e => e.Name).IsUnique();
            });
        }
    }
}
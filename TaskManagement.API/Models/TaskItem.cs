// Replace your TaskItem.cs model with this fixed version:

using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TaskManagement.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string AssignedTo { get; set; } = string.Empty;

        public int WorkRequired { get; set; } = 1;

        [Required]
        public DateTime Deadline { get; set; }

        [Range(0, 100)]
        public int PercentCompleted { get; set; } = 0;

        // Convert enum to/from string for JSON
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public TaskItemStatus Status { get; set; } = TaskItemStatus.NotStarted;

        [Required]
        [MaxLength(100)]
        public string GroupTask { get; set; } = "General";

        // New fields
        [Required]
        [MaxLength(150)]
        public string Customer { get; set; } = string.Empty;

        [MaxLength(20)]
        public string PhoneNo { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string SportPlayed { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Updates { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    // Make sure enum values match exactly with frontend
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum TaskItemStatus
    {
        NotStarted,
        InProgress,
        Late,
        Completed,
        OnHold,
        Cancelled
    }
}
// Models/TaskItem.cs - Updated with new fields
namespace TaskManagement.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string AssignedTo { get; set; } = string.Empty;
        public int WorkRequired { get; set; }
        public DateTime Deadline { get; set; }
        public int PercentCompleted { get; set; }
        public TaskItemStatus Status { get; set; }
        public string GroupTask { get; set; } = string.Empty;

        // New fields
        public string Customer { get; set; } = string.Empty;
        public string PhoneNo { get; set; } = string.Empty;
        public string SportPlayed { get; set; } = string.Empty;
        public string Updates { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

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
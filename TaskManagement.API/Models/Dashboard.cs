namespace TaskManagement.Models
{
    public class DashboardData
    {
        public TaskCompletionStats TaskCompletion { get; set; } = new();
        public ActiveTaskStats ActiveTasks { get; set; } = new();
        public ResourceWorkloadStats ResourceWorkload { get; set; } = new();
        public ProjectCompletionStats ProjectCompletion { get; set; } = new();
        public List<TaskItem> Tasks { get; set; } = new();
        public List<Resource> Resources { get; set; } = new();
    }

    public class TaskCompletionStats
    {
        public int OnTrack { get; set; }
        public int Late { get; set; }
    }

    public class ActiveTaskStats
    {
        public int Completed { get; set; }
        public int InProgress { get; set; }
        public int NotStarted { get; set; }
    }

    public class ResourceWorkloadStats
    {
        public int Done { get; set; }
        public int LeftToDo { get; set; }
    }

    public class ProjectCompletionStats
    {
        public int CompletionPercentage { get; set; }
    }
}
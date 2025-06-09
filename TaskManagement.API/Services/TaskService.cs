// Services/TaskService.cs - Updated to handle new fields properly
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using TaskManagement.Models;

namespace TaskManagement.Services
{
    public class TaskService : ITaskService
    {
        private readonly TaskContext _context;
        private readonly ILogger<TaskService> _logger;

        public TaskService(TaskContext context, ILogger<TaskService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<TaskItem>> GetAllTasksAsync()
        {
            try
            {
                _logger.LogInformation("Fetching all tasks from database");
                var tasks = await _context.Tasks.ToListAsync();
                _logger.LogInformation($"Successfully retrieved {tasks.Count} tasks");
                return tasks;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching tasks from database");
                throw;
            }
        }

        public async Task<TaskItem?> GetTaskByIdAsync(int id)
        {
            try
            {
                return await _context.Tasks.FindAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching task with ID {id}");
                throw;
            }
        }

        // Replace your CreateTaskAsync method in TaskService.cs with this:

        public async Task<TaskItem> CreateTaskAsync(TaskItem task)
        {
            try
            {
                _logger.LogInformation("TaskService: Creating new task: {TaskName}", task.Name);

                // Set creation timestamp
                task.CreatedAt = DateTime.UtcNow;
                task.UpdatedAt = null;

                // Validate required fields
                if (string.IsNullOrWhiteSpace(task.Name))
                    throw new ArgumentException("Task name is required");
                if (string.IsNullOrWhiteSpace(task.AssignedTo))
                    throw new ArgumentException("AssignedTo is required");
                if (string.IsNullOrWhiteSpace(task.Customer))
                    throw new ArgumentException("Customer is required");
                if (string.IsNullOrWhiteSpace(task.SportPlayed))
                    throw new ArgumentException("Sport is required");
                if (task.Deadline == default(DateTime))
                    throw new ArgumentException("Valid deadline is required");

                // Set default values for optional fields
                task.GroupTask = string.IsNullOrWhiteSpace(task.GroupTask) ? "General" : task.GroupTask.Trim();
                task.PhoneNo = task.PhoneNo?.Trim() ?? "";
                task.Updates = task.Updates?.Trim() ?? "";
                task.WorkRequired = task.WorkRequired <= 0 ? 1 : task.WorkRequired;
                task.PercentCompleted = Math.Max(0, Math.Min(100, task.PercentCompleted));

                // Trim required fields
                task.Name = task.Name.Trim();
                task.AssignedTo = task.AssignedTo.Trim();
                task.Customer = task.Customer.Trim();
                task.SportPlayed = task.SportPlayed.Trim();

                // Log the final task data before saving
                _logger.LogInformation("Final task data: Name='{Name}', Customer='{Customer}', Sport='{Sport}', AssignedTo='{AssignedTo}', Deadline='{Deadline}', GroupTask='{GroupTask}'",
                    task.Name, task.Customer, task.SportPlayed, task.AssignedTo, task.Deadline, task.GroupTask);

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created task with ID: {TaskId}", task.Id);
                return task;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new task: {TaskName}", task?.Name);
                throw;
            }
        }
        public async Task<TaskItem?> UpdateTaskAsync(int id, TaskItem task)
        {
            try
            {
                _logger.LogInformation("Updating task with ID: {TaskId}", id);

                var existingTask = await _context.Tasks.FindAsync(id);
                if (existingTask == null)
                {
                    _logger.LogWarning("Task with ID {TaskId} not found", id);
                    return null;
                }

                // Update all fields
                existingTask.Name = task.Name;
                existingTask.AssignedTo = task.AssignedTo;
                existingTask.WorkRequired = task.WorkRequired;
                existingTask.Deadline = task.Deadline;
                existingTask.PercentCompleted = Math.Max(0, Math.Min(100, task.PercentCompleted));
                existingTask.Status = task.Status;
                existingTask.GroupTask = string.IsNullOrWhiteSpace(task.GroupTask) ? "General" : task.GroupTask;
                existingTask.Customer = task.Customer;
                existingTask.PhoneNo = task.PhoneNo ?? "";
                existingTask.SportPlayed = task.SportPlayed;
                existingTask.Updates = task.Updates ?? "";
                existingTask.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated task with ID: {TaskId}", id);
                return existingTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating task with ID {id}");
                throw;
            }
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            try
            {
                _logger.LogInformation("Deleting task with ID: {TaskId}", id);

                var task = await _context.Tasks.FindAsync(id);
                if (task == null)
                {
                    _logger.LogWarning("Task with ID {TaskId} not found for deletion", id);
                    return false;
                }

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully deleted task with ID: {TaskId}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting task with ID {id}");
                throw;
            }
        }

        public async Task<DashboardData> GetDashboardDataAsync()
        {
            try
            {
                _logger.LogInformation("Fetching dashboard data");

                // Fetch tasks first, then resources - avoid concurrent operations
                var tasks = await _context.Tasks.ToListAsync();
                _logger.LogInformation($"Retrieved {tasks.Count} tasks");

                var resources = await _context.Resources.ToListAsync();
                _logger.LogInformation($"Retrieved {resources.Count} resources");

                // Calculate dashboard statistics
                var dashboard = new DashboardData
                {
                    Tasks = tasks,
                    Resources = resources,
                    TaskCompletion = new TaskCompletionStats
                    {
                        OnTrack = tasks.Count(t => t.Status == TaskItemStatus.InProgress || t.Status == TaskItemStatus.Completed),
                        Late = tasks.Count(t => t.Status == TaskItemStatus.Late)
                    },
                    ActiveTasks = new ActiveTaskStats
                    {
                        Completed = tasks.Count(t => t.Status == TaskItemStatus.Completed),
                        InProgress = tasks.Count(t => t.Status == TaskItemStatus.InProgress),
                        NotStarted = tasks.Count(t => t.Status == TaskItemStatus.NotStarted)
                    },
                    ResourceWorkload = new ResourceWorkloadStats
                    {
                        Done = resources.Sum(r => r.WorkloadHours),
                        LeftToDo = Math.Max(0, 200 - resources.Sum(r => r.WorkloadHours))
                    },
                    ProjectCompletion = new ProjectCompletionStats
                    {
                        CompletionPercentage = tasks.Any() ? (int)tasks.Average(t => t.PercentCompleted) : 0
                    }
                };

                _logger.LogInformation("Dashboard data calculated successfully");
                return dashboard;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating dashboard data");
                throw;
            }
        }
    }
}
// Services/TaskService.cs - Fixed version without concurrency issues
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

        public async Task<TaskItem> CreateTaskAsync(TaskItem task)
        {
            try
            {
                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();
                return task;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new task");
                throw;
            }
        }

        public async Task<TaskItem?> UpdateTaskAsync(int id, TaskItem task)
        {
            try
            {
                var existingTask = await _context.Tasks.FindAsync(id);
                if (existingTask == null) return null;

                existingTask.Name = task.Name;
                existingTask.AssignedTo = task.AssignedTo;
                existingTask.WorkRequired = task.WorkRequired;
                existingTask.Deadline = task.Deadline;
                existingTask.PercentCompleted = task.PercentCompleted;
                existingTask.Status = task.Status;
                existingTask.GroupTask = task.GroupTask;

                await _context.SaveChangesAsync();
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
                var task = await _context.Tasks.FindAsync(id);
                if (task == null) return false;

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
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
// Controllers/TasksController.cs - Updated with better error handling
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Models;
using TaskManagement.Services;

namespace TaskManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(ITaskService taskService, ILogger<TasksController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<TaskItem>>> GetTasks()
        {
            try
            {
                _logger.LogInformation("Getting all tasks");
                var tasks = await _taskService.GetAllTasksAsync();
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tasks");
                return StatusCode(500, new { message = "Error retrieving tasks", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            try
            {
                _logger.LogInformation("Getting task with ID: {TaskId}", id);
                var task = await _taskService.GetTaskByIdAsync(id);
                if (task == null)
                {
                    _logger.LogWarning("Task with ID {TaskId} not found", id);
                    return NotFound(new { message = $"Task with ID {id} not found" });
                }
                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving task with ID: {TaskId}", id);
                return StatusCode(500, new { message = "Error retrieving task", error = ex.Message });
            }
        }

        // Replace your CreateTask method in TasksController.cs with this fixed version:

        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask([FromBody] TaskItem task)
        {
            try
            {
                _logger.LogInformation("=== CREATE TASK DEBUG ===");
                _logger.LogInformation("Request received");
                _logger.LogInformation("Content-Type: {ContentType}", Request.ContentType);

                // Check if model state is valid
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("ModelState is invalid:");
                    foreach (var error in ModelState)
                    {
                        _logger.LogWarning("Key: {Key}, Errors: {Errors}",
                            error.Key, string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage)));
                    }

                    return BadRequest(new
                    {
                        message = "Model validation failed",
                        errors = ModelState.ToDictionary(
                            kvp => kvp.Key,
                            kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray()
                        )
                    });
                }

                if (task == null)
                {
                    _logger.LogWarning("Task object is null after model binding");
                    return BadRequest(new
                    {
                        message = "Task data is required",
                        hint = "Check if JSON is properly formatted and Content-Type header is set to application/json"
                    });
                }

                _logger.LogInformation("Task object successfully bound: {@Task}", task);
                _logger.LogInformation("Task fields: Name='{Name}', Customer='{Customer}', Sport='{Sport}', AssignedTo='{AssignedTo}', Deadline='{Deadline}', Status='{Status}'",
                    task.Name, task.Customer, task.SportPlayed, task.AssignedTo, task.Deadline, task.Status);

                // Manual validation of required fields
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(task.Name))
                    validationErrors.Add("Task name is required");

                if (string.IsNullOrWhiteSpace(task.AssignedTo))
                    validationErrors.Add("Assigned to is required");

                if (string.IsNullOrWhiteSpace(task.Customer))
                    validationErrors.Add("Customer is required");

                if (string.IsNullOrWhiteSpace(task.SportPlayed))
                    validationErrors.Add("Sport is required");

                if (task.Deadline == default(DateTime))
                    validationErrors.Add("Valid deadline is required");

                if (validationErrors.Any())
                {
                    _logger.LogWarning("Manual validation failed: {Errors}", string.Join(", ", validationErrors));
                    return BadRequest(new
                    {
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                _logger.LogInformation("Validation passed, creating task...");
                var createdTask = await _taskService.CreateTaskAsync(task);
                _logger.LogInformation("Successfully created task with ID: {TaskId}", createdTask.Id);

                return CreatedAtAction(nameof(GetTask), new { id = createdTask.Id }, createdTask);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Task creation failed due to invalid data: {Error}", ex.Message);
                return BadRequest(new
                {
                    message = ex.Message,
                    type = "ArgumentException"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return StatusCode(500, new
                {
                    message = "Internal server error while creating task",
                    error = ex.Message,
                    type = ex.GetType().Name
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskItem>> UpdateTask(int id, [FromBody] TaskItem task)
        {
            try
            {
                _logger.LogInformation("Updating task with ID: {TaskId}", id);

                if (task == null)
                {
                    _logger.LogWarning("Attempted to update task {TaskId} with null data", id);
                    return BadRequest(new { message = "Task data is required" });
                }

                // Validate required fields
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(task.Name))
                    validationErrors.Add("Task name is required");

                if (string.IsNullOrWhiteSpace(task.AssignedTo))
                    validationErrors.Add("Assigned to is required");

                if (string.IsNullOrWhiteSpace(task.Customer))
                    validationErrors.Add("Customer is required");

                if (string.IsNullOrWhiteSpace(task.SportPlayed))
                    validationErrors.Add("Sport is required");

                if (task.Deadline == default(DateTime))
                    validationErrors.Add("Deadline is required");

                if (validationErrors.Any())
                {
                    _logger.LogWarning("Task update failed due to validation errors: {Errors}", string.Join(", ", validationErrors));
                    return BadRequest(new { message = "Validation failed", errors = validationErrors });
                }

                var updatedTask = await _taskService.UpdateTaskAsync(id, task);
                if (updatedTask == null)
                {
                    _logger.LogWarning("Task with ID {TaskId} not found for update", id);
                    return NotFound(new { message = $"Task with ID {id} not found" });
                }

                _logger.LogInformation("Successfully updated task with ID: {TaskId}", id);
                return Ok(updatedTask);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning("Task update failed due to invalid data: {Error}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task with ID: {TaskId}", id);
                return StatusCode(500, new { message = "Error updating task", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                _logger.LogInformation("Deleting task with ID: {TaskId}", id);

                var result = await _taskService.DeleteTaskAsync(id);
                if (!result)
                {
                    _logger.LogWarning("Task with ID {TaskId} not found for deletion", id);
                    return NotFound(new { message = $"Task with ID {id} not found" });
                }

                _logger.LogInformation("Successfully deleted task with ID: {TaskId}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task with ID: {TaskId}", id);
                return StatusCode(500, new { message = "Error deleting task", error = ex.Message });
            }
        }
    }
}
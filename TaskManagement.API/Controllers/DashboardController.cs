// Controllers/DashboardController.cs
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Models;
using TaskManagement.Services;

namespace TaskManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(ITaskService taskService, ILogger<DashboardController> logger)
        {
            _taskService = taskService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardData>> GetDashboardData()
        {
            try
            {
                _logger.LogInformation("=== DASHBOARD ENDPOINT CALLED ===");
                _logger.LogInformation("Route: GET /api/dashboard");

                var dashboardData = await _taskService.GetDashboardDataAsync();

                // Add detailed logging of what we're returning
                _logger.LogInformation("Dashboard data retrieved successfully");
                _logger.LogInformation("Tasks count in response: {TasksCount}", dashboardData.Tasks?.Count ?? 0);
                _logger.LogInformation("Resources count in response: {ResourcesCount}", dashboardData.Resources?.Count ?? 0);
                _logger.LogInformation("TaskCompletion: OnTrack={OnTrack}, Late={Late}",
                    dashboardData.TaskCompletion?.OnTrack ?? 0,
                    dashboardData.TaskCompletion?.Late ?? 0);

                // Log the structure we're returning
                _logger.LogInformation("Response structure: {@DashboardData}", dashboardData);

                return Ok(dashboardData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving dashboard data");
                return StatusCode(500, new { message = "Error retrieving dashboard data", error = ex.Message });
            }
        }
    }
}
// Controllers/ResourcesController.cs
using Microsoft.AspNetCore.Mvc;
using TaskManagement.Models;
using TaskManagement.Services;

namespace TaskManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ResourcesController : ControllerBase
    {
        private readonly IResourceService _resourceService;

        public ResourcesController(IResourceService resourceService)
        {
            _resourceService = resourceService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Resource>>> GetResources()
        {
            var resources = await _resourceService.GetAllResourcesAsync();
            return Ok(resources);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Resource>> GetResource(int id)
        {
            var resource = await _resourceService.GetResourceByIdAsync(id);
            if (resource == null) return NotFound();
            return Ok(resource);
        }

        [HttpPost]
        public async Task<ActionResult<Resource>> CreateResource(Resource resource)
        {
            var createdResource = await _resourceService.CreateResourceAsync(resource);
            return CreatedAtAction(nameof(GetResource), new { id = createdResource.Id }, createdResource);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Resource>> UpdateResource(int id, Resource resource)
        {
            var updatedResource = await _resourceService.UpdateResourceAsync(id, resource);
            if (updatedResource == null) return NotFound();
            return Ok(updatedResource);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResource(int id)
        {
            var result = await _resourceService.DeleteResourceAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
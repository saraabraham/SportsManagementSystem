// Services/ResourceService.cs
using Microsoft.EntityFrameworkCore;
using TaskManagement.Data;
using TaskManagement.Models;

namespace TaskManagement.Services
{
    public class ResourceService : IResourceService
    {
        private readonly TaskContext _context;

        public ResourceService(TaskContext context)
        {
            _context = context;
        }

        public async Task<List<Resource>> GetAllResourcesAsync()
        {
            return await _context.Resources.ToListAsync();
        }

        public async Task<Resource?> GetResourceByIdAsync(int id)
        {
            return await _context.Resources.FindAsync(id);
        }

        public async Task<Resource> CreateResourceAsync(Resource resource)
        {
            _context.Resources.Add(resource);
            await _context.SaveChangesAsync();
            return resource;
        }

        public async Task<Resource?> UpdateResourceAsync(int id, Resource resource)
        {
            var existingResource = await _context.Resources.FindAsync(id);
            if (existingResource == null) return null;

            existingResource.Name = resource.Name;
            existingResource.WorkloadHours = resource.WorkloadHours;
            existingResource.Status = resource.Status;

            await _context.SaveChangesAsync();
            return existingResource;
        }

        public async Task<bool> DeleteResourceAsync(int id)
        {
            var resource = await _context.Resources.FindAsync(id);
            if (resource == null) return false;

            _context.Resources.Remove(resource);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
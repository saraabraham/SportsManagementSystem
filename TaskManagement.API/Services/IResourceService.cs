// Services/IResourceService.cs
using TaskManagement.Models;

namespace TaskManagement.Services
{
    public interface IResourceService
    {
        Task<List<Resource>> GetAllResourcesAsync();
        Task<Resource?> GetResourceByIdAsync(int id);
        Task<Resource> CreateResourceAsync(Resource resource);
        Task<Resource?> UpdateResourceAsync(int id, Resource resource);
        Task<bool> DeleteResourceAsync(int id);
    }
}

namespace TaskManagement.Models
{
    public class Resource
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int WorkloadHours { get; set; }
        public ResourceStatus Status { get; set; }
    }

    public enum ResourceStatus
    {
        Available,
        Busy,
        Overloaded
    }
}
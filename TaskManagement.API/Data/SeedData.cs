// Data/SeedData.cs - Updated with new fields
using TaskManagement.Models;
using Microsoft.EntityFrameworkCore;

namespace TaskManagement.Data
{
    public static class SeedData
    {
        public static void Initialize(TaskContext context)
        {
            try
            {
                // Check if data already exists
                if (context.Tasks.Any() || context.Resources.Any())
                {
                    return; // Database has been seeded
                }

                // Seed Resources first
                var resources = new List<Resource>
                {
                    new() { Name = "John", WorkloadHours = 40, Status = ResourceStatus.Busy },
                    new() { Name = "Mary", WorkloadHours = 45, Status = ResourceStatus.Overloaded },
                    new() { Name = "Alfred", WorkloadHours = 25, Status = ResourceStatus.Available },
                    new() { Name = "Justin", WorkloadHours = 35, Status = ResourceStatus.Busy },
                    new() { Name = "Ben", WorkloadHours = 20, Status = ResourceStatus.Available },
                    new() { Name = "Betty", WorkloadHours = 30, Status = ResourceStatus.Available }
                };

                context.Resources.AddRange(resources);
                context.SaveChanges(); // Save resources first

                // Use DateTime.UtcNow to avoid timezone issues
                var baseDate = DateTime.UtcNow.Date;

                var tasks = new List<TaskItem>
                {
                    // Group Task 1 - Football Training
                    new() {
                        Name = "Football Training Session",
                        AssignedTo = "John",
                        WorkRequired = 3,
                        Deadline = baseDate.AddDays(7),
                        PercentCompleted = 0,
                        Status = TaskItemStatus.NotStarted,
                        GroupTask = "Sports Training",
                        Customer = "Manchester United FC",
                        PhoneNo = "+1-555-0101",
                        SportPlayed = "Football",
                        Updates = "Initial setup required",
                        CreatedAt = baseDate.AddDays(-2)
                    },
                    new() {
                        Name = "Basketball Court Booking",
                        AssignedTo = "Alfred",
                        WorkRequired = 2,
                        Deadline = baseDate.AddDays(-5),
                        PercentCompleted = 80,
                        Status = TaskItemStatus.Late,
                        GroupTask = "Sports Training",
                        Customer = "Lakers Academy",
                        PhoneNo = "+1-555-0102",
                        SportPlayed = "Basketball",
                        Updates = "Court almost ready, final inspection pending",
                        CreatedAt = baseDate.AddDays(-15)
                    },
                    new() {
                        Name = "Tennis Equipment Setup",
                        AssignedTo = "Mary",
                        WorkRequired = 4,
                        Deadline = baseDate.AddDays(10),
                        PercentCompleted = 50,
                        Status = TaskItemStatus.InProgress,
                        GroupTask = "Sports Training",
                        Customer = "Wimbledon Club",
                        PhoneNo = "+1-555-0103",
                        SportPlayed = "Tennis",
                        Updates = "Equipment delivered, installation in progress",
                        CreatedAt = baseDate.AddDays(-5),
                        UpdatedAt = baseDate.AddDays(-1)
                    },
                    new() {
                        Name = "Swimming Pool Maintenance",
                        AssignedTo = "Justin",
                        WorkRequired = 5,
                        Deadline = baseDate.AddDays(3),
                        PercentCompleted = 30,
                        Status = TaskItemStatus.InProgress,
                        GroupTask = "Sports Training",
                        Customer = "Aquatic Center",
                        PhoneNo = "+1-555-0104",
                        SportPlayed = "Swimming",
                        Updates = "Chemical balance adjusted, filtration system checked",
                        CreatedAt = baseDate.AddDays(-8)
                    },
                    new() {
                        Name = "Cricket Pitch Preparation",
                        AssignedTo = "Mary",
                        WorkRequired = 6,
                        Deadline = baseDate.AddDays(14),
                        PercentCompleted = 70,
                        Status = TaskItemStatus.InProgress,
                        GroupTask = "Sports Training",
                        Customer = "England Cricket Board",
                        PhoneNo = "+1-555-0105",
                        SportPlayed = "Cricket",
                        Updates = "Pitch leveling complete, grass seeding in progress",
                        CreatedAt = baseDate.AddDays(-12),
                        UpdatedAt = baseDate.AddDays(-2)
                    },

                    // Group Task 2 - Event Management
                    new() {
                        Name = "Marathon Event Setup",
                        AssignedTo = "John",
                        WorkRequired = 8,
                        Deadline = baseDate.AddDays(-1),
                        PercentCompleted = 25,
                        Status = TaskItemStatus.Late,
                        GroupTask = "Event Management",
                        Customer = "City Marathon Association",
                        PhoneNo = "+1-555-0201",
                        SportPlayed = "Running",
                        Updates = "Route planning delayed due to city permits",
                        CreatedAt = baseDate.AddDays(-20)
                    },
                    new() {
                        Name = "Golf Tournament Organization",
                        AssignedTo = "Ben",
                        WorkRequired = 7,
                        Deadline = baseDate.AddDays(21),
                        PercentCompleted = 60,
                        Status = TaskItemStatus.InProgress,
                        GroupTask = "Event Management",
                        Customer = "PGA Championship",
                        PhoneNo = "+1-555-0202",
                        SportPlayed = "Golf",
                        Updates = "Sponsorship confirmed, venue setup 60% complete",
                        CreatedAt = baseDate.AddDays(-30),
                        UpdatedAt = baseDate.AddDays(-3)
                    },
                    new() {
                        Name = "Boxing Match Coordination",
                        AssignedTo = "Betty",
                        WorkRequired = 4,
                        Deadline = baseDate.AddDays(-45),
                        PercentCompleted = 100,
                        Status = TaskItemStatus.Completed,
                        GroupTask = "Event Management",
                        Customer = "World Boxing Federation",
                        PhoneNo = "+1-555-0203",
                        SportPlayed = "Boxing",
                        Updates = "Event successfully completed, all objectives met",
                        CreatedAt = baseDate.AddDays(-60),
                        UpdatedAt = baseDate.AddDays(-45)
                    },
                    new() {
                        Name = "Volleyball League Setup",
                        AssignedTo = "Mary",
                        WorkRequired = 5,
                        Deadline = baseDate.AddDays(-30),
                        PercentCompleted = 100,
                        Status = TaskItemStatus.Completed,
                        GroupTask = "Event Management",
                        Customer = "International Volleyball Federation",
                        PhoneNo = "+1-555-0204",
                        SportPlayed = "Volleyball",
                        Updates = "League successfully launched, 12 teams participating",
                        CreatedAt = baseDate.AddDays(-50),
                        UpdatedAt = baseDate.AddDays(-30)
                    },
                    new() {
                        Name = "Cycling Race Preparation",
                        AssignedTo = "Alfred",
                        WorkRequired = 6,
                        Deadline = baseDate.AddDays(30),
                        PercentCompleted = 40,
                        Status = TaskItemStatus.InProgress,
                        GroupTask = "Event Management",
                        Customer = "Tour de City",
                        PhoneNo = "+1-555-0205",
                        SportPlayed = "Cycling",
                        Updates = "Route mapping complete, safety barriers being installed",
                        CreatedAt = baseDate.AddDays(-10),
                        UpdatedAt = baseDate.AddDays(-1)
                    }
                };

                context.Tasks.AddRange(tasks);
                context.SaveChanges(); // Save tasks

                Console.WriteLine($"Database seeded successfully with {resources.Count} resources and {tasks.Count} tasks");
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error seeding data: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }
    }
}
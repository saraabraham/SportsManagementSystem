// Update your Program.cs with this enhanced JSON configuration:

using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc; // Added for ApiBehaviorOptions
using TaskManagement.Data;
using TaskManagement.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container with enhanced JSON configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for better enum and property handling
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keep original property names (PascalCase)
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true; // Allow case insensitive matching
        options.JsonSerializerOptions.WriteIndented = true; // Pretty print JSON in responses
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()); // Handle enums as strings
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull; // Ignore null values
        options.JsonSerializerOptions.AllowTrailingCommas = true; // Allow trailing commas in JSON
        // Removed unsupported JsonCommentHandling configuration
    });

// Configure model validation
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    // Disable automatic 400 responses for model validation errors
    // We want to handle them manually in our controllers
    options.SuppressModelStateInvalidFilter = false;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add PostgreSQL Entity Framework with better error handling
builder.Services.AddDbContext<TaskContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    });

    // Enable detailed errors in development
    if (builder.Environment.IsDevelopment())
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Add CORS for multiple environments
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOrigins", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.WithOrigins("http://localhost:4200")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
        else
        {
            policy.WithOrigins(
                builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                ?? new[] { "https://yourdomain.com" }
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
        }
    });
});

// Add services
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IResourceService, ResourceService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseHttpsRedirection();
    app.UseHsts();

    // Add security headers
    app.Use(async (context, next) =>
    {
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        await next();
    });
}

app.UseCors("AllowOrigins");
app.UseAuthorization();
app.MapControllers();

// Database initialization with proper error handling
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var scopedLogger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        scopedLogger.LogInformation("Starting database initialization...");

        var context = services.GetRequiredService<TaskContext>();

        // Ensure database is created
        await context.Database.EnsureCreatedAsync();
        scopedLogger.LogInformation("Database ensured created");

        // Check if database has any data
        var taskCount = await context.Tasks.CountAsync();
        var resourceCount = await context.Resources.CountAsync();

        scopedLogger.LogInformation($"Current database state: {taskCount} tasks, {resourceCount} resources");

        // Only seed if database is empty
        if (taskCount == 0 && resourceCount == 0)
        {
            scopedLogger.LogInformation("Database is empty, seeding with initial data...");
            SeedData.Initialize(context);
            scopedLogger.LogInformation("Database seeded successfully");
        }
        else
        {
            scopedLogger.LogInformation("Database already contains data, skipping seeding");
        }
    }
    catch (Exception ex)
    {
        scopedLogger.LogError(ex, "An error occurred while initializing the database");
        // Don't throw here to allow the app to start even if seeding fails
    }
}

var logger = app.Services.GetRequiredService<ILogger<Program>>();
logger.LogInformation("Application starting on {Urls}",
    builder.Environment.IsDevelopment() ? "http://localhost:5031" : "configured URLs");

app.Run();
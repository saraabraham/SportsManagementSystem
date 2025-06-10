// Controllers/FixturesController.cs - Simple approach using dictionaries to avoid EF mapping issues
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using TaskManagement.Data;
using System.Text.Json.Serialization;

namespace TaskManagement.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FixturesController : ControllerBase
    {
        private readonly TaskContext _context;
        private readonly ILogger<FixturesController> _logger;
        private readonly IConfiguration _configuration;

        public FixturesController(TaskContext context, ILogger<FixturesController> logger, IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        [HttpGet("weekly-schedule")]
        public async Task<ActionResult> GetWeeklySchedule([FromQuery] string startDate, [FromQuery] string endDate)
        {
            try
            {
                _logger.LogInformation("Fetching weekly schedule from {StartDate} to {EndDate}", startDate, endDate);

                var connectionString = _configuration.GetConnectionString("DefaultConnection");

                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                // Get time slots
                var timeSlots = new List<Dictionary<string, object>>();
                using (var cmd = new NpgsqlCommand(@"
                    SELECT id, day_of_week, start_time, end_time, sport, max_capacity, 
                           location, notes, is_active, created_at, updated_at 
                    FROM time_slots 
                    WHERE is_active = true
                    ORDER BY 
                        CASE day_of_week
                            WHEN 'Monday' THEN 1
                            WHEN 'Tuesday' THEN 2
                            WHEN 'Wednesday' THEN 3
                            WHEN 'Thursday' THEN 4
                            WHEN 'Friday' THEN 5
                            WHEN 'Saturday' THEN 6
                            WHEN 'Sunday' THEN 7
                        END,
                        start_time", connection))
                {
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var timeSlot = new Dictionary<string, object>
                        {
                            ["id"] = reader.GetInt32(reader.GetOrdinal("id")),
                            ["dayOfWeek"] = reader.GetString(reader.GetOrdinal("day_of_week")),
                            ["startTime"] = reader.GetTimeSpan(reader.GetOrdinal("start_time")).ToString(@"hh\:mm"),
                            ["endTime"] = reader.GetTimeSpan(reader.GetOrdinal("end_time")).ToString(@"hh\:mm"),
                            ["sport"] = reader.GetString(reader.GetOrdinal("sport")),
                            ["maxCapacity"] = reader.GetInt32(reader.GetOrdinal("max_capacity")),
                            ["location"] = reader.IsDBNull(reader.GetOrdinal("location")) ? "" : reader.GetString(reader.GetOrdinal("location")),
                            ["notes"] = reader.IsDBNull(reader.GetOrdinal("notes")) ? "" : reader.GetString(reader.GetOrdinal("notes")),
                            ["isActive"] = reader.GetBoolean(reader.GetOrdinal("is_active")),
                            ["createdAt"] = reader.GetDateTime(reader.GetOrdinal("created_at")),
                            ["updatedAt"] = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
                        };
                        timeSlots.Add(timeSlot);
                    }
                }

                // Get registrations
                var registrations = new List<Dictionary<string, object>>();
                using (var cmd = new NpgsqlCommand(@"
                    SELECT id, time_slot_id, attendee_id, registration_date, is_regular, notes, created_at
                    FROM time_slot_registrations", connection))
                {
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var registration = new Dictionary<string, object>
                        {
                            ["id"] = reader.GetInt32(reader.GetOrdinal("id")),
                            ["timeSlotId"] = reader.GetInt32(reader.GetOrdinal("time_slot_id")),
                            ["attendeeId"] = reader.GetInt32(reader.GetOrdinal("attendee_id")),
                            ["registrationDate"] = reader.GetDateTime(reader.GetOrdinal("registration_date")),
                            ["isRegular"] = reader.GetBoolean(reader.GetOrdinal("is_regular")),
                            ["notes"] = reader.IsDBNull(reader.GetOrdinal("notes")) ? "" : reader.GetString(reader.GetOrdinal("notes")),
                            ["createdAt"] = reader.GetDateTime(reader.GetOrdinal("created_at"))
                        };
                        registrations.Add(registration);
                    }
                }

                // Get attendees
                var attendees = new List<Dictionary<string, object>>();
                using (var cmd = new NpgsqlCommand(@"
                    SELECT id, name, email, phone, emergency_contact, date_of_birth, 
                           medical_notes, is_active, created_at, updated_at
                    FROM attendees 
                    WHERE is_active = true", connection))
                {
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var attendee = new Dictionary<string, object>
                        {
                            ["id"] = reader.GetInt32(reader.GetOrdinal("id")),
                            ["name"] = reader.GetString(reader.GetOrdinal("name")),
                            ["email"] = reader.IsDBNull(reader.GetOrdinal("email")) ? "" : reader.GetString(reader.GetOrdinal("email")),
                            ["phone"] = reader.IsDBNull(reader.GetOrdinal("phone")) ? "" : reader.GetString(reader.GetOrdinal("phone")),
                            ["emergencyContact"] = reader.IsDBNull(reader.GetOrdinal("emergency_contact")) ? "" : reader.GetString(reader.GetOrdinal("emergency_contact")),
                            ["dateOfBirth"] = reader.IsDBNull(reader.GetOrdinal("date_of_birth")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("date_of_birth")),
                            ["medicalNotes"] = reader.IsDBNull(reader.GetOrdinal("medical_notes")) ? "" : reader.GetString(reader.GetOrdinal("medical_notes")),
                            ["isActive"] = reader.GetBoolean(reader.GetOrdinal("is_active")),
                            ["createdAt"] = reader.GetDateTime(reader.GetOrdinal("created_at")),
                            ["updatedAt"] = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
                        };
                        attendees.Add(attendee);
                    }
                }

                // Get attendance records for the current date
                var currentDate = DateTime.Today.ToString("yyyy-MM-dd");
                var attendanceRecords = new List<Dictionary<string, object>>();
                using (var cmd = new NpgsqlCommand(@"
                    SELECT id, time_slot_id, attendee_id, attendance_date, is_present, 
                           checked_in_at, checked_out_at, notes, recorded_by, created_at, updated_at
                    FROM attendance_records 
                    WHERE attendance_date = @currentDate", connection))
                {
                    cmd.Parameters.AddWithValue("@currentDate", DateTime.Parse(currentDate));
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var record = new Dictionary<string, object>
                        {
                            ["id"] = reader.GetInt32(reader.GetOrdinal("id")),
                            ["timeSlotId"] = reader.GetInt32(reader.GetOrdinal("time_slot_id")),
                            ["attendeeId"] = reader.GetInt32(reader.GetOrdinal("attendee_id")),
                            ["attendanceDate"] = reader.GetDateTime(reader.GetOrdinal("attendance_date")),
                            ["isPresent"] = reader.GetBoolean(reader.GetOrdinal("is_present")),
                            ["checkedInAt"] = reader.IsDBNull(reader.GetOrdinal("checked_in_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("checked_in_at")),
                            ["checkedOutAt"] = reader.IsDBNull(reader.GetOrdinal("checked_out_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("checked_out_at")),
                            ["notes"] = reader.IsDBNull(reader.GetOrdinal("notes")) ? "" : reader.GetString(reader.GetOrdinal("notes")),
                            ["recordedBy"] = reader.IsDBNull(reader.GetOrdinal("recorded_by")) ? "" : reader.GetString(reader.GetOrdinal("recorded_by")),
                            ["createdAt"] = reader.GetDateTime(reader.GetOrdinal("created_at")),
                            ["updatedAt"] = reader.IsDBNull(reader.GetOrdinal("updated_at")) ? (DateTime?)null : reader.GetDateTime(reader.GetOrdinal("updated_at"))
                        };
                        attendanceRecords.Add(record);
                    }
                }

                var response = new
                {
                    timeSlots = timeSlots,
                    registrations = registrations,
                    attendees = attendees,
                    attendanceRecords = attendanceRecords
                };

                _logger.LogInformation("Retrieved {TimeSlotCount} time slots, {RegistrationCount} registrations, {AttendeeCount} attendees, {AttendanceCount} attendance records",
                    timeSlots.Count, registrations.Count, attendees.Count, attendanceRecords.Count);

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving weekly schedule");
                return StatusCode(500, new { message = "Error retrieving weekly schedule", error = ex.Message });
            }
        }

        [HttpPost("time-slots")]
        public async Task<ActionResult> CreateTimeSlot([FromBody] CreateTimeSlotRequest request)
        {
            try
            {
                _logger.LogInformation("Creating time slot for {DayOfWeek} {Sport} {StartTime}-{EndTime}",
                    request.DayOfWeek, request.Sport, request.StartTime, request.EndTime);

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new NpgsqlCommand(@"
                    INSERT INTO time_slots (day_of_week, start_time, end_time, sport, max_capacity, location, notes, is_active, created_at, updated_at)
                    VALUES (@dayOfWeek, @startTime, @endTime, @sport, @maxCapacity, @location, @notes, true, @createdAt, @updatedAt)", connection);

                cmd.Parameters.AddWithValue("@dayOfWeek", request.DayOfWeek);
                cmd.Parameters.AddWithValue("@startTime", TimeSpan.Parse(request.StartTime));
                cmd.Parameters.AddWithValue("@endTime", TimeSpan.Parse(request.EndTime));
                cmd.Parameters.AddWithValue("@sport", request.Sport);
                cmd.Parameters.AddWithValue("@maxCapacity", request.MaxCapacity ?? 10);
                cmd.Parameters.AddWithValue("@location", request.Location ?? "");
                cmd.Parameters.AddWithValue("@notes", request.Notes ?? "");
                cmd.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
                cmd.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

                var result = await cmd.ExecuteNonQueryAsync();

                if (result > 0)
                {
                    _logger.LogInformation("Time slot created successfully");
                    return Ok(new { message = "Time slot created successfully" });
                }

                return BadRequest(new { message = "Failed to create time slot" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating time slot");
                return StatusCode(500, new { message = "Error creating time slot", error = ex.Message });
            }
        }
        [HttpPost("attendees")]
        public async Task<ActionResult> AddAttendee([FromBody] AddAttendeeRequest request)
        {
            try
            {
                _logger.LogInformation("=== ADD ATTENDEE REQUEST RECEIVED ===");
                _logger.LogInformation("TimeSlotId: {TimeSlotId}", request.TimeSlotId);
                _logger.LogInformation("Name: {Name}", request.Name);

                // Basic validation
                if (request.TimeSlotId <= 0)
                {
                    return BadRequest(new { message = "Invalid time slot ID" });
                }

                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { message = "Attendee name is required" });
                }

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                // Check if time slot exists
                using (var checkCmd = new NpgsqlCommand("SELECT id FROM time_slots WHERE id = @timeSlotId AND is_active = true", connection))
                {
                    checkCmd.Parameters.AddWithValue("@timeSlotId", request.TimeSlotId);
                    var timeSlotExists = await checkCmd.ExecuteScalarAsync();

                    if (timeSlotExists == null)
                    {
                        _logger.LogError("Time slot {TimeSlotId} not found", request.TimeSlotId);
                        return BadRequest(new { message = "Time slot not found" });
                    }
                }

                int attendeeId;
                string trimmedName = request.Name.Trim();

                // Check if attendee exists
                using (var cmd = new NpgsqlCommand("SELECT id FROM attendees WHERE LOWER(TRIM(name)) = LOWER(@name) AND is_active = true", connection))
                {
                    cmd.Parameters.AddWithValue("@name", trimmedName);
                    var existingId = await cmd.ExecuteScalarAsync();

                    if (existingId != null)
                    {
                        attendeeId = (int)existingId;
                        _logger.LogInformation("Using existing attendee ID: {AttendeeId}", attendeeId);
                    }
                    else
                    {
                        // Create new attendee
                        using var insertCmd = new NpgsqlCommand(@"
                    INSERT INTO attendees (name, email, phone, is_active, created_at, updated_at)
                    VALUES (@name, @email, @phone, true, @createdAt, @updatedAt)
                    RETURNING id", connection);

                        insertCmd.Parameters.AddWithValue("@name", trimmedName);
                        insertCmd.Parameters.AddWithValue("@email", request.Email?.Trim() ?? "");
                        insertCmd.Parameters.AddWithValue("@phone", request.Phone?.Trim() ?? "");
                        insertCmd.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
                        insertCmd.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

                        var newId = await insertCmd.ExecuteScalarAsync();
                        if (newId == null)
                        {
                            return StatusCode(500, new { message = "Failed to create attendee" });
                        }

                        attendeeId = (int)newId;
                        _logger.LogInformation("Created new attendee ID: {AttendeeId}", attendeeId);
                    }
                }

                // Check if already registered
                using (var checkRegCmd = new NpgsqlCommand("SELECT id FROM time_slot_registrations WHERE time_slot_id = @timeSlotId AND attendee_id = @attendeeId", connection))
                {
                    checkRegCmd.Parameters.AddWithValue("@timeSlotId", request.TimeSlotId);
                    checkRegCmd.Parameters.AddWithValue("@attendeeId", attendeeId);

                    var existingReg = await checkRegCmd.ExecuteScalarAsync();
                    if (existingReg != null)
                    {
                        return BadRequest(new { message = "Attendee already registered for this time slot" });
                    }
                }

                // Create registration
                using (var regCmd = new NpgsqlCommand(@"
            INSERT INTO time_slot_registrations (time_slot_id, attendee_id, registration_date, is_regular, created_at)
            VALUES (@timeSlotId, @attendeeId, @registrationDate, false, @createdAt)", connection))
                {
                    regCmd.Parameters.AddWithValue("@timeSlotId", request.TimeSlotId);
                    regCmd.Parameters.AddWithValue("@attendeeId", attendeeId);
                    regCmd.Parameters.AddWithValue("@registrationDate", DateTime.Today);
                    regCmd.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                    await regCmd.ExecuteNonQueryAsync();
                }

                _logger.LogInformation("Successfully registered attendee {AttendeeId} for time slot {TimeSlotId}", attendeeId, request.TimeSlotId);

                return Ok(new
                {
                    message = "Attendee added successfully",
                    attendeeId = attendeeId,
                    timeSlotId = request.TimeSlotId
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding attendee");
                return StatusCode(500, new { message = "Error adding attendee", error = ex.Message });
            }
        }

        [HttpPost("attendance")]
        public async Task<ActionResult> UpdateAttendance([FromBody] UpdateAttendanceRequest request)
        {
            try
            {
                _logger.LogInformation("Updating attendance for attendee {AttendeeId} in time slot {TimeSlotId} on {Date} to {IsPresent}",
                    request.AttendeeId, request.TimeSlotId, request.AttendanceDate, request.IsPresent);

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                // Parse the attendance date - handle both date string and current date
                DateTime attendanceDate;
                if (!string.IsNullOrEmpty(request.AttendanceDate))
                {
                    if (!DateTime.TryParse(request.AttendanceDate, out attendanceDate))
                    {
                        attendanceDate = DateTime.Today;
                    }
                }
                else
                {
                    attendanceDate = DateTime.Today;
                }

                _logger.LogInformation("Using attendance date: {AttendanceDate}", attendanceDate);

                // Check if attendance record already exists
                using (var checkCmd = new NpgsqlCommand(@"
            SELECT id FROM attendance_records 
            WHERE time_slot_id = @timeSlotId AND attendee_id = @attendeeId AND attendance_date = @attendanceDate", connection))
                {
                    checkCmd.Parameters.AddWithValue("@timeSlotId", request.TimeSlotId);
                    checkCmd.Parameters.AddWithValue("@attendeeId", request.AttendeeId);
                    checkCmd.Parameters.AddWithValue("@attendanceDate", attendanceDate);

                    var existingId = await checkCmd.ExecuteScalarAsync();

                    if (existingId != null)
                    {
                        // Update existing record
                        using var updateCmd = new NpgsqlCommand(@"
                    UPDATE attendance_records 
                    SET is_present = @isPresent, checked_in_at = @checkedInAt, updated_at = @updatedAt
                    WHERE time_slot_id = @timeSlotId AND attendee_id = @attendeeId AND attendance_date = @attendanceDate", connection);

                        updateCmd.Parameters.AddWithValue("@isPresent", request.IsPresent);
                        updateCmd.Parameters.AddWithValue("@checkedInAt", (object?)request.CheckedInAt ?? DBNull.Value);
                        updateCmd.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);
                        updateCmd.Parameters.AddWithValue("@timeSlotId", request.TimeSlotId);
                        updateCmd.Parameters.AddWithValue("@attendeeId", request.AttendeeId);
                        updateCmd.Parameters.AddWithValue("@attendanceDate", attendanceDate);

                        await updateCmd.ExecuteNonQueryAsync();
                        _logger.LogInformation("Updated existing attendance record");
                    }
                    else
                    {
                        // Create new record
                        using var insertCmd = new NpgsqlCommand(@"
                    INSERT INTO attendance_records (time_slot_id, attendee_id, attendance_date, is_present, checked_in_at, created_at, updated_at)
                    VALUES (@timeSlotId, @attendeeId, @attendanceDate, @isPresent, @checkedInAt, @createdAt, @updatedAt)", connection);

                        insertCmd.Parameters.AddWithValue("@timeSlotId", request.TimeSlotId);
                        insertCmd.Parameters.AddWithValue("@attendeeId", request.AttendeeId);
                        insertCmd.Parameters.AddWithValue("@attendanceDate", attendanceDate);
                        insertCmd.Parameters.AddWithValue("@isPresent", request.IsPresent);
                        insertCmd.Parameters.AddWithValue("@checkedInAt", (object?)request.CheckedInAt ?? DBNull.Value);
                        insertCmd.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);
                        insertCmd.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

                        await insertCmd.ExecuteNonQueryAsync();
                        _logger.LogInformation("Created new attendance record");
                    }
                }

                _logger.LogInformation("Attendance updated successfully");
                return Ok(new { message = "Attendance updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating attendance for attendee {AttendeeId} in time slot {TimeSlotId}",
                    request.AttendeeId, request.TimeSlotId);
                return StatusCode(500, new { message = "Error updating attendance", error = ex.Message, details = ex.ToString() });
            }
        }

        [HttpDelete("time-slots/{id}")]
        public async Task<ActionResult> DeleteTimeSlot(int id)
        {
            try
            {
                _logger.LogInformation("Deleting time slot {TimeSlotId}", id);

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new NpgsqlCommand(@"
                    UPDATE time_slots 
                    SET is_active = false, updated_at = @updatedAt
                    WHERE id = @id", connection);

                cmd.Parameters.AddWithValue("@id", id);
                cmd.Parameters.AddWithValue("@updatedAt", DateTime.UtcNow);

                var result = await cmd.ExecuteNonQueryAsync();

                if (result > 0)
                {
                    _logger.LogInformation("Time slot {TimeSlotId} deleted successfully", id);
                    return Ok(new { message = "Time slot deleted successfully" });
                }

                return NotFound(new { message = "Time slot not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting time slot {TimeSlotId}", id);
                return StatusCode(500, new { message = "Error deleting time slot", error = ex.Message });
            }
        }

        [HttpDelete("registrations/{timeSlotId}/{attendeeId}")]
        public async Task<ActionResult> RemoveAttendee(int timeSlotId, int attendeeId)
        {
            try
            {
                _logger.LogInformation("Removing attendee {AttendeeId} from time slot {TimeSlotId}", attendeeId, timeSlotId);

                var connectionString = _configuration.GetConnectionString("DefaultConnection");
                using var connection = new NpgsqlConnection(connectionString);
                await connection.OpenAsync();

                using var cmd = new NpgsqlCommand(@"
                    DELETE FROM time_slot_registrations 
                    WHERE time_slot_id = @timeSlotId AND attendee_id = @attendeeId", connection);

                cmd.Parameters.AddWithValue("@timeSlotId", timeSlotId);
                cmd.Parameters.AddWithValue("@attendeeId", attendeeId);

                var result = await cmd.ExecuteNonQueryAsync();

                if (result > 0)
                {
                    _logger.LogInformation("Attendee {AttendeeId} removed from time slot {TimeSlotId} successfully", attendeeId, timeSlotId);
                    return Ok(new { message = "Attendee removed successfully" });
                }

                return NotFound(new { message = "Registration not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing attendee {AttendeeId} from time slot {TimeSlotId}", attendeeId, timeSlotId);
                return StatusCode(500, new { message = "Error removing attendee", error = ex.Message });
            }
        }
    }

    // Request models
    public class CreateTimeSlotRequest
    {
        public string DayOfWeek { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Sport { get; set; } = string.Empty;
        public int? MaxCapacity { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
    }

    public class AddAttendeeRequest
    {
        [JsonPropertyName("timeSlotId")]
        public int TimeSlotId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }
    }

    public class UpdateAttendanceRequest
    {
        public int TimeSlotId { get; set; }
        public int AttendeeId { get; set; }
        public string AttendanceDate { get; set; } = string.Empty;
        public bool IsPresent { get; set; }
        public DateTime? CheckedInAt { get; set; }
    }
}
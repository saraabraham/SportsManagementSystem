// src/app/services/fixtures.service.ts
// Fixed service with proper database integration

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
    TimeSlot,
    WeeklySchedule,
    CreateTimeSlotRequest,
    AddAttendeeRequest,
    AttendanceUpdate,
    DayOfWeek,
    Attendee
} from '../models/fixtures.model';

import { TaskItem } from '../models/task.model';
import { TaskItemStatus } from '../enums/task-item-status.enum';
import { DashboardService } from './dashboard.service';

// Database entities matching your schema
interface DbTimeSlot {
    id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    sport: string;
    max_capacity: number;
    location: string;
    notes: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface DbAttendee {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    emergency_contact?: string;
    date_of_birth?: string;
    medical_notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface DbRegistration {
    id: number;
    time_slot_id: number;
    attendee_id: number;
    registration_date: string;
    is_regular: boolean;
    notes?: string;
    created_at: string;
}

interface DbAttendanceRecord {
    id: number;
    time_slot_id: number;
    attendee_id: number;
    attendance_date: string;
    is_present: boolean;
    checked_in_at?: string;
    checked_out_at?: string;
    notes?: string;
    recorded_by?: string;
    created_at: string;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class FixturesService {
    private http = inject(HttpClient);
    private dashboardService = inject(DashboardService);
    private apiUrl = environment.apiUrl;

    // Signals for reactive state management
    public currentWeekSchedule = signal<WeeklySchedule | null>(null);
    public loading = signal<boolean>(false);
    public error = signal<string | null>(null);

    getWeeklySchedule(weekStartDate: Date): Observable<WeeklySchedule> {
        this.loading.set(true);
        this.error.set(null);

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Get current date for attendance filtering
        const currentDate = new Date().toISOString().split('T')[0];

        return this.http.get<{
            timeSlots: DbTimeSlot[];
            registrations: DbRegistration[];
            attendees: DbAttendee[];
            attendanceRecords: DbAttendanceRecord[];
        }>(`${this.apiUrl}/fixtures/weekly-schedule`, {
            params: {
                startDate: weekStartDate.toISOString().split('T')[0],
                endDate: weekEndDate.toISOString().split('T')[0]
            }
        }).pipe(
            map(data => this.transformToWeeklySchedule(data, weekStartDate, weekEndDate, currentDate)),
            tap(schedule => {
                this.currentWeekSchedule.set(schedule);
                this.loading.set(false);
                console.log('Weekly schedule loaded from database:', schedule);
            }),
            catchError(error => {
                console.error('Error loading weekly schedule:', error);
                this.error.set('Failed to load weekly schedule');
                this.loading.set(false);
                // Return fallback empty schedule
                return of({
                    weekStartDate,
                    weekEndDate,
                    timeSlots: []
                });
            })
        );
    }

    private transformToWeeklySchedule(
        data: any,
        weekStartDate: Date,
        weekEndDate: Date,
        currentDate: string
    ): WeeklySchedule {
        console.log('Raw data from backend:', data);

        const timeSlots: TimeSlot[] = data.timeSlots.map((dbSlot: any) => {
            console.log('Processing time slot:', dbSlot);

            // Get registrations for this time slot
            const slotRegistrations = data.registrations.filter(
                (reg: any) => reg.timeSlotId === dbSlot.id
            );

            // Build attendees with current task counts and attendance status
            const attendees: Attendee[] = slotRegistrations.map((reg: any) => {
                const dbAttendee = data.attendees.find((att: any) => att.id === reg.attendeeId);
                if (!dbAttendee) return null;

                // Find today's attendance record for this attendee and time slot
                const todayAttendance = data.attendanceRecords.find(
                    (record: any) =>
                        record.timeSlotId === dbSlot.id &&
                        record.attendeeId === dbAttendee.id &&
                        record.attendanceDate === currentDate
                );

                // Get pending task count for this customer
                const pendingTasksCount = this.getCustomerPendingTasksSync(dbAttendee.name, dbSlot.sport);

                return {
                    id: `${dbSlot.id}_${dbAttendee.id}`, // Composite ID for frontend
                    name: dbAttendee.name,
                    isPresent: todayAttendance?.isPresent || false,
                    checkedInAt: todayAttendance?.checkedInAt ? new Date(todayAttendance.checkedInAt) : undefined,
                    contactInfo: {
                        email: dbAttendee.email,
                        phone: dbAttendee.phone
                    },
                    pendingTasksCount: pendingTasksCount,
                    // Store database IDs for backend operations
                    dbAttendeeId: dbAttendee.id,
                    dbTimeSlotId: dbSlot.id
                } as Attendee & { dbAttendeeId: number; dbTimeSlotId: number };
            }).filter(Boolean) as Attendee[];

            return {
                id: dbSlot.id.toString(),
                dayOfWeek: dbSlot.dayOfWeek as DayOfWeek,
                startTime: dbSlot.startTime,
                endTime: dbSlot.endTime,
                sport: dbSlot.sport,
                attendees: attendees,
                maxCapacity: dbSlot.maxCapacity,
                location: dbSlot.location,
                notes: dbSlot.notes,
                createdAt: dbSlot.createdAt ? new Date(dbSlot.createdAt) : new Date(),
                updatedAt: dbSlot.updatedAt ? new Date(dbSlot.updatedAt) : undefined
            };
        });

        console.log('Transformed time slots:', timeSlots);

        return {
            weekStartDate,
            weekEndDate,
            timeSlots
        };
    }

    private getCustomerPendingTasksSync(customerName: string, sport?: string): number {
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) return 0;

        const pendingTasks = dashboardData.Tasks.filter(task => {
            const isCustomerMatch = task.Customer.toLowerCase() === customerName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;
            const matchesSport = !sport || task.SportPlayed === sport;

            return isCustomerMatch && isPending && matchesSport;
        });

        return pendingTasks.length;
    }

    createTimeSlot(request: CreateTimeSlotRequest): Observable<TimeSlot> {
        console.log('Creating time slot:', request);

        return this.http.post<DbTimeSlot>(`${this.apiUrl}/fixtures/time-slots`, {
            day_of_week: request.dayOfWeek,
            start_time: request.startTime,
            end_time: request.endTime,
            sport: request.sport,
            max_capacity: request.maxCapacity || 10,
            location: request.location || '',
            notes: request.notes || ''
        }).pipe(
            map(dbSlot => this.transformDbTimeSlotToTimeSlot(dbSlot)),
            tap(() => this.refreshCurrentWeek())
        );
    }

    // Fixed addAttendee method in fixtures.service.ts
    addAttendee(request: AddAttendeeRequest): Observable<void> {
        console.log('=== FIXTURES SERVICE: ADD ATTENDEE ===');
        console.log('Original request:', request);

        // Ensure timeSlotId is a number
        const timeSlotId = typeof request.timeSlotId === 'string' ?
            parseInt(request.timeSlotId, 10) : request.timeSlotId;

        if (isNaN(timeSlotId)) {
            console.error('Invalid timeSlotId:', request.timeSlotId);
            return throwError(() => new Error('Invalid time slot ID'));
        }

        // Send the exact format expected by backend (camelCase to match JsonPropertyName)
        const payload = {
            timeSlotId: timeSlotId,  // This matches [JsonPropertyName("timeSlotId")]
            name: request.name,      // This matches [JsonPropertyName("name")]
            email: request.contactInfo?.email || null,   // This matches [JsonPropertyName("email")]
            phone: request.contactInfo?.phone || null    // This matches [JsonPropertyName("phone")]
        };

        console.log('Sending payload to backend:', payload);
        console.log('Payload JSON:', JSON.stringify(payload, null, 2));

        return this.http.post<void>(`${this.apiUrl}/fixtures/attendees`, payload).pipe(
            tap((response) => {
                console.log('✅ Backend response:', response);
                console.log('✅ Attendee added successfully');
                this.refreshCurrentWeek();
            }),
            catchError(error => {
                console.error('❌ Backend error details:', {
                    status: error.status,
                    statusText: error.statusText,
                    url: error.url,
                    error: error.error,
                    message: error.message
                });
                console.error('❌ Request that failed:', payload);
                return throwError(() => error);
            })
        );
    }



    // Fixed updateAttendance method in fixtures.service.ts
    updateAttendance(update: AttendanceUpdate): Observable<void> {
        console.log('Updating attendance:', update);

        // Extract database IDs from composite attendee ID
        const attendeeData = this.findAttendeeDbData(update.timeSlotId, update.attendeeId);
        if (!attendeeData) {
            console.error('Could not find attendee database data');
            return of(void 0);
        }

        const currentDate = new Date().toISOString().split('T')[0];

        // Fixed: Use the correct field names expected by backend
        const requestPayload = {
            TimeSlotId: attendeeData.dbTimeSlotId,  // Capital T
            AttendeeId: attendeeData.dbAttendeeId,  // Capital A
            AttendanceDate: currentDate,            // Capital A and D
            IsPresent: update.isPresent,            // Capital I and P
            CheckedInAt: update.isPresent ? (update.checkedInAt || new Date()).toISOString() : null
        };

        console.log('Sending attendance update request:', requestPayload);

        return this.http.post<void>(`${this.apiUrl}/fixtures/attendance`, requestPayload).pipe(
            tap(() => {
                console.log('✅ Attendance updated successfully');
                // Only refresh if the update was successful
                this.refreshCurrentWeek();
            }),
            catchError(error => {
                console.error('❌ Error updating attendance:', error);
                console.error('Request payload that failed:', requestPayload);
                throw error;
            })
        );
    }

    deleteTimeSlot(timeSlotId: string): Observable<void> {
        console.log('Deleting time slot:', timeSlotId);

        return this.http.delete<void>(`${this.apiUrl}/fixtures/time-slots/${timeSlotId}`).pipe(
            tap(() => this.refreshCurrentWeek())
        );
    }

    removeAttendee(timeSlotId: string, attendeeId: string): Observable<void> {
        console.log('Removing attendee:', timeSlotId, attendeeId);

        const attendeeData = this.findAttendeeDbData(timeSlotId, attendeeId);
        if (!attendeeData) {
            console.error('Could not find attendee database data');
            return of(void 0);
        }

        return this.http.delete<void>(`${this.apiUrl}/fixtures/registrations/${attendeeData.dbTimeSlotId}/${attendeeData.dbAttendeeId}`).pipe(
            tap(() => this.refreshCurrentWeek())
        );
    }

    private findAttendeeDbData(timeSlotId: string, attendeeId: string): { dbTimeSlotId: number; dbAttendeeId: number } | null {
        const currentSchedule = this.currentWeekSchedule();
        if (!currentSchedule) return null;

        const timeSlot = currentSchedule.timeSlots.find(ts => ts.id === timeSlotId);
        if (!timeSlot) return null;

        const attendee = timeSlot.attendees.find(a => a.id === attendeeId) as any;
        if (!attendee || !attendee.dbAttendeeId || !attendee.dbTimeSlotId) return null;

        return {
            dbTimeSlotId: attendee.dbTimeSlotId,
            dbAttendeeId: attendee.dbAttendeeId
        };
    }

    private transformDbTimeSlotToTimeSlot(dbSlot: DbTimeSlot): TimeSlot {
        return {
            id: dbSlot.id.toString(),
            dayOfWeek: dbSlot.day_of_week as DayOfWeek,
            startTime: dbSlot.start_time,
            endTime: dbSlot.end_time,
            sport: dbSlot.sport,
            attendees: [],
            maxCapacity: dbSlot.max_capacity,
            location: dbSlot.location,
            notes: dbSlot.notes,
            createdAt: new Date(dbSlot.created_at),
            updatedAt: dbSlot.updated_at ? new Date(dbSlot.updated_at) : undefined
        };
    }

    getCurrentWeek(): Date {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    private refreshCurrentWeek(): void {
        const currentSchedule = this.currentWeekSchedule();
        if (currentSchedule) {
            this.getWeeklySchedule(currentSchedule.weekStartDate).subscribe();
        }
    }

    formatTime(time: string): string {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    formatTimeRange(startTime: string, endTime: string): string {
        return `${this.formatTime(startTime)} - ${this.formatTime(endTime)}`;
    }
}
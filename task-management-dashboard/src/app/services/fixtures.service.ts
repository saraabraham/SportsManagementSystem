// src/app/services/fixtures.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
    TimeSlot,
    WeeklySchedule,
    CreateTimeSlotRequest,
    AddAttendeeRequest,
    AttendanceUpdate,
    DayOfWeek,
    DAYS_OF_WEEK
} from '../models/fixtures.model';
import { TaskItem } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class FixturesService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Signals for reactive state management
    public currentWeekSchedule = signal<WeeklySchedule | null>(null);
    public loading = signal<boolean>(false);
    public error = signal<string | null>(null);

    // Mock data for development (remove when backend is ready)
    private mockTimeSlots: TimeSlot[] = [
        {
            id: '1',
            dayOfWeek: DayOfWeek.Monday,
            startTime: '08:00',
            endTime: '09:00',
            sport: 'Football',
            attendees: [
                { id: '1', name: 'John', isPresent: true, checkedInAt: new Date(), pendingTasksCount: 2 },
                { id: '2', name: 'Mary', isPresent: false, pendingTasksCount: 1 }
            ],
            maxCapacity: 20,
            location: 'Main Field',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '2',
            dayOfWeek: DayOfWeek.Monday,
            startTime: '10:00',
            endTime: '11:00',
            sport: 'Basketball',
            attendees: [
                { id: '3', name: 'Alfred', isPresent: true, checkedInAt: new Date(), pendingTasksCount: 0 },
                { id: '4', name: 'Justin', isPresent: true, checkedInAt: new Date(), pendingTasksCount: 3 }
            ],
            maxCapacity: 10,
            location: 'Court A',
            createdAt: new Date()
        },
        {
            id: '3',
            dayOfWeek: DayOfWeek.Tuesday,
            startTime: '14:00',
            endTime: '15:00',
            sport: 'Tennis',
            attendees: [
                { id: '5', name: 'Ben', isPresent: false, pendingTasksCount: 1 },
                { id: '6', name: 'Betty', isPresent: true, checkedInAt: new Date(), pendingTasksCount: 0 }
            ],
            maxCapacity: 4,
            location: 'Tennis Court 1',
            createdAt: new Date()
        }
    ];

    getWeeklySchedule(weekStartDate: Date): Observable<WeeklySchedule> {
        this.loading.set(true);
        this.error.set(null);

        // Calculate week end date
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // For now, return mock data - replace with actual API call
        return of({
            weekStartDate,
            weekEndDate,
            timeSlots: this.mockTimeSlots
        }).pipe(
            tap(schedule => {
                this.currentWeekSchedule.set(schedule);
                this.loading.set(false);
            })
        );

        // Uncomment when backend is ready:
        // return this.http.get<WeeklySchedule>(`${this.apiUrl}/fixtures/week`, {
        //   params: { startDate: weekStartDate.toISOString() }
        // }).pipe(
        //   tap(schedule => {
        //     this.currentWeekSchedule.set(schedule);
        //     this.loading.set(false);
        //   })
        // );
    }

    createTimeSlot(request: CreateTimeSlotRequest): Observable<TimeSlot> {
        // Mock implementation - replace with actual API call
        const newTimeSlot: TimeSlot = {
            id: Date.now().toString(),
            dayOfWeek: request.dayOfWeek,
            startTime: request.startTime,
            endTime: request.endTime,
            sport: request.sport,
            attendees: [],
            maxCapacity: request.maxCapacity || 10,
            location: request.location || '',
            notes: request.notes || '',
            createdAt: new Date()
        };

        this.mockTimeSlots.push(newTimeSlot);
        this.refreshCurrentWeek();

        return of(newTimeSlot);

        // Uncomment when backend is ready:
        // return this.http.post<TimeSlot>(`${this.apiUrl}/fixtures/timeslots`, request)
        //   .pipe(tap(() => this.refreshCurrentWeek()));
    }

    addAttendee(request: AddAttendeeRequest): Observable<void> {
        // Mock implementation
        const timeSlot = this.mockTimeSlots.find(ts => ts.id === request.timeSlotId);
        if (timeSlot) {
            const newAttendee = {
                id: Date.now().toString(),
                name: request.name,
                isPresent: false,
                contactInfo: request.contactInfo,
                pendingTasksCount: Math.floor(Math.random() * 4) // Mock pending tasks count
            };
            timeSlot.attendees.push(newAttendee);
            this.refreshCurrentWeek();
        }

        return of(void 0);

        // Uncomment when backend is ready:
        // return this.http.post<void>(`${this.apiUrl}/fixtures/attendees`, request)
        //   .pipe(tap(() => this.refreshCurrentWeek()));
    }

    updateAttendance(update: AttendanceUpdate): Observable<void> {
        // Mock implementation
        const timeSlot = this.mockTimeSlots.find(ts => ts.id === update.timeSlotId);
        if (timeSlot) {
            const attendee = timeSlot.attendees.find(a => a.id === update.attendeeId);
            if (attendee) {
                attendee.isPresent = update.isPresent;
                attendee.checkedInAt = update.isPresent ? new Date() : undefined;
                this.refreshCurrentWeek();
            }
        }

        return of(void 0);

        // Uncomment when backend is ready:
        // return this.http.put<void>(`${this.apiUrl}/fixtures/attendance`, update)
        //   .pipe(tap(() => this.refreshCurrentWeek()));
    }

    deleteTimeSlot(timeSlotId: string): Observable<void> {
        // Mock implementation
        const index = this.mockTimeSlots.findIndex(ts => ts.id === timeSlotId);
        if (index > -1) {
            this.mockTimeSlots.splice(index, 1);
            this.refreshCurrentWeek();
        }

        return of(void 0);

        // Uncomment when backend is ready:
        // return this.http.delete<void>(`${this.apiUrl}/fixtures/timeslots/${timeSlotId}`)
        //   .pipe(tap(() => this.refreshCurrentWeek()));
    }

    removeAttendee(timeSlotId: string, attendeeId: string): Observable<void> {
        // Mock implementation
        const timeSlot = this.mockTimeSlots.find(ts => ts.id === timeSlotId);
        if (timeSlot) {
            const index = timeSlot.attendees.findIndex(a => a.id === attendeeId);
            if (index > -1) {
                timeSlot.attendees.splice(index, 1);
                this.refreshCurrentWeek();
            }
        }

        return of(void 0);

        // Uncomment when backend is ready:
        // return this.http.delete<void>(`${this.apiUrl}/fixtures/attendees/${attendeeId}`)
        //   .pipe(tap(() => this.refreshCurrentWeek()));
    }

    getAttendeePendingTasks(attendeeName: string): Observable<TaskItem[]> {
        // This will integrate with your existing task service
        // For now, return empty array - integrate with DashboardService later
        return of([]);

        // Integration with existing service:
        // return this.dashboardService.getDashboardData().pipe(
        //   map(data => data.tasks.filter(task => 
        //     task.assignedTo.toLowerCase() === attendeeName.toLowerCase() &&
        //     (task.status === TaskStatus.NotStarted || 
        //      task.status === TaskStatus.InProgress || 
        //      task.status === TaskStatus.Late)
        //   ))
        // );
    }

    getCurrentWeek(): Date {
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    getWeekDates(startDate: Date): Date[] {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
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
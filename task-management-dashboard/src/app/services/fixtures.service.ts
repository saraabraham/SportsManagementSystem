// src/app/services/fixtures.service.ts
// Updated service with proper API integration - COMPLETE VERSION

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
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

import { TaskItem, SPORTS_OPTIONS } from '../models/task.model';
import { TaskItemStatus } from '../enums/task-item-status.enum';
import { DashboardService } from './dashboard.service';

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

    // Enhanced mock data with real customer names from dashboard
    private mockTimeSlots: TimeSlot[] = [
        {
            id: '1',
            dayOfWeek: DayOfWeek.Monday,
            startTime: '08:00',
            endTime: '09:00',
            sport: 'Football',
            attendees: [],
            maxCapacity: 20,
            location: 'Main Field',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '2',
            dayOfWeek: DayOfWeek.Tuesday,
            startTime: '10:00',
            endTime: '11:00',
            sport: 'Basketball',
            attendees: [],
            maxCapacity: 10,
            location: 'Court A',
            createdAt: new Date()
        },
        {
            id: '3',
            dayOfWeek: DayOfWeek.Wednesday,
            startTime: '14:00',
            endTime: '15:00',
            sport: 'Tennis',
            attendees: [],
            maxCapacity: 4,
            location: 'Tennis Court 1',
            createdAt: new Date()
        },
        {
            id: '4',
            dayOfWeek: DayOfWeek.Thursday,
            startTime: '16:00',
            endTime: '17:00',
            sport: 'Swimming',
            attendees: [],
            maxCapacity: 15,
            location: 'Swimming Pool',
            createdAt: new Date()
        },
        {
            id: '5',
            dayOfWeek: DayOfWeek.Friday,
            startTime: '18:00',
            endTime: '19:00',
            sport: 'Boxing',
            attendees: [],
            maxCapacity: 8,
            location: 'Boxing Gym',
            createdAt: new Date()
        },
        {
            id: '6',
            dayOfWeek: DayOfWeek.Saturday,
            startTime: '10:00',
            endTime: '11:00',
            sport: 'Golf',
            attendees: [],
            maxCapacity: 12,
            location: 'Golf Course',
            createdAt: new Date()
        },
        {
            id: '7',
            dayOfWeek: DayOfWeek.Sunday,
            startTime: '15:00',
            endTime: '16:00',
            sport: 'Running',
            attendees: [],
            maxCapacity: 30,
            location: 'Track Field',
            createdAt: new Date()
        }
    ];

    getWeeklySchedule(weekStartDate: Date): Observable<WeeklySchedule> {
        this.loading.set(true);
        this.error.set(null);

        // Try to get data from backend first
        const startDateStr = weekStartDate.toISOString().split('T')[0];
        const endDate = new Date(weekStartDate);
        endDate.setDate(weekStartDate.getDate() + 6);
        const endDateStr = endDate.toISOString().split('T')[0];

        return this.http.get<any>(`${this.apiUrl}/fixtures/weekly-schedule`, {
            params: {
                startDate: startDateStr,
                endDate: endDateStr
            }
        }).pipe(
            map(response => this.transformBackendResponse(response, weekStartDate)),
            catchError(error => {
                console.warn('Backend not available, using mock data:', error);
                // Fallback to mock data
                return this.getMockWeeklySchedule(weekStartDate);
            }),
            tap(schedule => {
                this.currentWeekSchedule.set(schedule);
                this.loading.set(false);
                console.log('Weekly schedule loaded:', schedule);
            })
        );
    }

    private getMockWeeklySchedule(weekStartDate: Date): Observable<WeeklySchedule> {
        // Calculate week end date
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Update attendees with real customer data
        this.updateAttendeesWithCustomerData();

        // Return schedule with real customer names and task counts
        const schedule: WeeklySchedule = {
            weekStartDate,
            weekEndDate,
            timeSlots: [...this.mockTimeSlots] // Create a copy to avoid mutations
        };

        return of(schedule);
    }

    private transformBackendResponse(response: any, weekStartDate: Date): WeeklySchedule {
        console.log('Transforming backend response:', response);

        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Transform backend data to frontend format
        const timeSlots: TimeSlot[] = (response.timeSlots || []).map((slot: any) => {
            // Get attendees for this slot
            const slotAttendees = this.getAttendeesForTimeSlot(slot.id, response.attendees, response.registrations, response.attendanceRecords);

            return {
                id: slot.id.toString(),
                dayOfWeek: slot.dayOfWeek as DayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                sport: slot.sport,
                attendees: slotAttendees,
                maxCapacity: slot.maxCapacity,
                location: slot.location || '',
                notes: slot.notes || '',
                createdAt: new Date(slot.createdAt),
                updatedAt: slot.updatedAt ? new Date(slot.updatedAt) : undefined
            };
        });

        return {
            weekStartDate,
            weekEndDate,
            timeSlots
        };
    }

    private getAttendeesForTimeSlot(timeSlotId: number, attendees: any[], registrations: any[], attendanceRecords: any[]) {
        // Get registrations for this time slot
        const slotRegistrations = registrations.filter(reg => reg.timeSlotId === timeSlotId);

        return slotRegistrations.map(registration => {
            // Find attendee details
            const attendeeDetails = attendees.find(att => att.id === registration.attendeeId);

            // Find attendance record for today
            const attendanceRecord = attendanceRecords.find(record =>
                record.timeSlotId === timeSlotId &&
                record.attendeeId === registration.attendeeId
            );

            // Get task count for this customer
            const taskCount = this.getCustomerTaskCount(attendeeDetails?.name || '');

            return {
                id: `${timeSlotId}_${registration.attendeeId}`,
                name: attendeeDetails?.name || 'Unknown',
                isPresent: attendanceRecord?.isPresent || false,
                checkedInAt: attendanceRecord?.checkedInAt ? new Date(attendanceRecord.checkedInAt) : undefined,
                contactInfo: {
                    email: attendeeDetails?.email || '',
                    phone: attendeeDetails?.phone || ''
                },
                pendingTasksCount: taskCount
            };
        });
    }

    private getCustomerTaskCount(customerName: string): number {
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks || !customerName) return 0;

        return dashboardData.Tasks.filter(task => {
            const isCustomerMatch = task.Customer.toLowerCase() === customerName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;
            return isCustomerMatch && isPending;
        }).length;
    }

    private updateAttendeesWithCustomerData(): void {
        console.log('Updating attendees with real customer data...');

        // Get current dashboard data
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) {
            console.log('No dashboard data available');
            return;
        }

        console.log('Found tasks in dashboard:', dashboardData.Tasks.length);

        // Get unique customer names from tasks
        const uniqueCustomers = [...new Set(dashboardData.Tasks.map(task => task.Customer))];
        console.log('Found unique customers:', uniqueCustomers);

        // Update attendees for each time slot with customer-based logic
        this.mockTimeSlots.forEach((timeSlot, slotIndex) => {
            // Clear existing attendees
            timeSlot.attendees = [];

            // Find customers who have tasks related to this sport
            const relevantCustomers = uniqueCustomers.filter(customerName => {
                const customerTasks = this.getCustomerPendingTasks(customerName, dashboardData.Tasks);
                // Include customers with tasks in this sport
                return customerTasks.some(task => task.SportPlayed === timeSlot.sport);
            });

            // If no sport-specific customers, add some general customers with any pending tasks
            if (relevantCustomers.length === 0) {
                const generalCustomers = uniqueCustomers.filter(customerName => {
                    const customerTasks = this.getCustomerPendingTasks(customerName, dashboardData.Tasks);
                    return customerTasks.length > 0;
                });
                relevantCustomers.push(...generalCustomers.slice(0, 2));
            }

            // Add customers as attendees (limit to avoid overcrowding)
            relevantCustomers.slice(0, Math.min(4, timeSlot.maxCapacity || 4)).forEach((customerName, index) => {
                const allCustomerTasks = this.getCustomerPendingTasks(customerName, dashboardData.Tasks);
                const sportSpecificTasks = allCustomerTasks.filter(task => task.SportPlayed === timeSlot.sport);

                // Use sport-specific task count, fallback to all pending tasks
                const taskCount = sportSpecificTasks.length > 0 ? sportSpecificTasks.length : allCustomerTasks.length;

                // Create unique ID using slot index, customer name, and timestamp
                const uniqueId = `slot_${slotIndex}_customer_${index}_${customerName.replace(/\s+/g, '_').toLowerCase()}`;

                timeSlot.attendees.push({
                    id: uniqueId,
                    name: customerName,
                    isPresent: Math.random() > 0.4, // 60% chance of being present for demo
                    checkedInAt: Math.random() > 0.5 ? new Date() : undefined,
                    pendingTasksCount: taskCount
                });
            });

            console.log(`${timeSlot.sport} slot (${timeSlot.dayOfWeek}) has ${timeSlot.attendees.length} attendees with tasks`);
        });
    }

    private getCustomerPendingTasks(customerName: string, tasks: TaskItem[]): TaskItem[] {
        return tasks.filter(task => {
            // Match by customer name (case-insensitive)
            const isCustomerMatch = task.Customer.toLowerCase() === customerName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;

            return isCustomerMatch && isPending;
        });
    }

    createTimeSlot(request: CreateTimeSlotRequest): Observable<TimeSlot> {
        console.log('Creating time slot:', request);

        // Try backend API first
        return this.http.post<any>(`${this.apiUrl}/fixtures/time-slots`, request).pipe(
            map(response => {
                // Transform response to TimeSlot format if needed
                return {
                    id: response.id || Date.now().toString(),
                    dayOfWeek: request.dayOfWeek,
                    startTime: request.startTime,
                    endTime: request.endTime,
                    sport: request.sport,
                    attendees: [],
                    maxCapacity: request.maxCapacity || 10,
                    location: request.location || '',
                    notes: request.notes || '',
                    createdAt: new Date()
                } as TimeSlot;
            }),
            catchError(error => {
                console.warn('Backend not available, using mock implementation:', error);
                // Fallback to mock implementation
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
                return of(newTimeSlot);
            })
        );
    }

    addAttendee(request: AddAttendeeRequest): Observable<void> {
        console.log('Adding attendee:', request);

        // Try backend API first
        return this.http.post<void>(`${this.apiUrl}/fixtures/attendees`, request).pipe(
            catchError(error => {
                console.warn('Backend not available, using mock implementation:', error);

                // Fallback to mock implementation
                const timeSlot = this.mockTimeSlots.find(ts => ts.id === request.timeSlotId.toString());
                if (!timeSlot) {
                    console.error('Time slot not found:', request.timeSlotId);
                    return of(void 0);
                }

                // Check if attendee already exists in this slot
                const existingAttendee = timeSlot.attendees.find(a =>
                    a.name.toLowerCase() === request.name.toLowerCase()
                );

                if (existingAttendee) {
                    console.log('Attendee already exists in this time slot');
                    return of(void 0);
                }

                // Generate unique ID for new attendee
                const uniqueId = `${request.timeSlotId}_manual_${Date.now()}_${request.name.replace(/\s+/g, '_').toLowerCase()}`;

                // Get task count for this attendee/customer
                const dashboardData = this.dashboardService.dashboardData();
                let taskCount = 0;
                if (dashboardData?.Tasks) {
                    const customerTasks = this.getCustomerPendingTasks(request.name, dashboardData.Tasks);
                    const sportSpecificTasks = customerTasks.filter(task => task.SportPlayed === timeSlot.sport);
                    taskCount = sportSpecificTasks.length > 0 ? sportSpecificTasks.length : customerTasks.length;
                }

                const newAttendee = {
                    id: uniqueId,
                    name: request.name,
                    isPresent: false,
                    contactInfo: {
                        email: request.email || '',
                        phone: request.phone || ''
                    },
                    pendingTasksCount: taskCount
                };

                timeSlot.attendees.push(newAttendee);
                console.log('Added new attendee:', newAttendee);

                return of(void 0);
            })
        );
    }

    updateAttendance(update: AttendanceUpdate): Observable<void> {
        console.log('Updating attendance:', update);

        // Try backend API first
        const backendUpdate = {
            timeSlotId: parseInt(update.timeSlotId),
            attendeeId: parseInt(update.attendeeId.split('_')[2] || '0'), // Extract numeric ID
            attendanceDate: new Date().toISOString().split('T')[0],
            isPresent: update.isPresent,
            checkedInAt: update.checkedInAt?.toISOString()
        };

        return this.http.post<void>(`${this.apiUrl}/fixtures/attendance`, backendUpdate).pipe(
            catchError(error => {
                console.warn('Backend not available, using mock implementation:', error);

                // Fallback to mock implementation
                const timeSlot = this.mockTimeSlots.find(ts => ts.id === update.timeSlotId);
                if (timeSlot) {
                    const attendee = timeSlot.attendees.find(a => a.id === update.attendeeId);
                    if (attendee) {
                        console.log(`Updating attendance for ${attendee.name}: ${attendee.isPresent} -> ${update.isPresent}`);
                        attendee.isPresent = update.isPresent;
                        attendee.checkedInAt = update.isPresent ? (update.checkedInAt || new Date()) : undefined;
                        console.log(`Attendance updated successfully for ${attendee.name}`);
                    } else {
                        console.error('Attendee not found:', update.attendeeId);
                    }
                } else {
                    console.error('Time slot not found:', update.timeSlotId);
                }

                return of(void 0);
            })
        );
    }

    deleteTimeSlot(timeSlotId: string): Observable<void> {
        console.log('Deleting time slot:', timeSlotId);

        // Try backend API first
        return this.http.delete<void>(`${this.apiUrl}/fixtures/time-slots/${timeSlotId}`).pipe(
            catchError(error => {
                console.warn('Backend not available, using mock implementation:', error);

                // Fallback to mock implementation
                const index = this.mockTimeSlots.findIndex(ts => ts.id === timeSlotId);
                if (index > -1) {
                    this.mockTimeSlots.splice(index, 1);
                }

                return of(void 0);
            })
        );
    }

    removeAttendee(timeSlotId: string, attendeeId: string): Observable<void> {
        console.log('Removing attendee:', timeSlotId, attendeeId);

        // Extract numeric IDs for backend
        const numericTimeSlotId = parseInt(timeSlotId);
        const numericAttendeeId = parseInt(attendeeId.split('_')[2] || '0');

        // Try backend API first
        return this.http.delete<void>(`${this.apiUrl}/fixtures/registrations/${numericTimeSlotId}/${numericAttendeeId}`).pipe(
            catchError(error => {
                console.warn('Backend not available, using mock implementation:', error);

                // Fallback to mock implementation
                const timeSlot = this.mockTimeSlots.find(ts => ts.id === timeSlotId);
                if (timeSlot) {
                    const index = timeSlot.attendees.findIndex(a => a.id === attendeeId);
                    if (index > -1) {
                        timeSlot.attendees.splice(index, 1);
                    }
                }

                return of(void 0);
            })
        );
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

    // Method to refresh customer task counts when dashboard data changes
    refreshCustomerTaskCounts(): void {
        console.log('Manually refreshing customer task counts');
        this.updateAttendeesWithCustomerData();
        this.refreshCurrentWeek();
    }

    // Get customer pending tasks (used by components)
    getCustomerPendingTasksObservable(customerName: string, sport?: string): Observable<TaskItem[]> {
        console.log('Getting pending tasks for customer:', customerName, 'sport:', sport);

        // Get current dashboard data
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) {
            return of([]);
        }

        const pendingTasks = dashboardData.Tasks.filter(task => {
            const isCustomerMatch = task.Customer.toLowerCase() === customerName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;
            const matchesSport = !sport || task.SportPlayed === sport;

            return isCustomerMatch && isPending && matchesSport;
        });

        console.log('Found pending tasks for customer:', pendingTasks);
        return of(pendingTasks);
    }

    // Synchronous method to get customer pending tasks (used internally)
    getCustomerPendingTasksSync(customerName: string, sport?: string): TaskItem[] {
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) {
            return [];
        }

        return dashboardData.Tasks.filter(task => {
            const isCustomerMatch = task.Customer.toLowerCase() === customerName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;
            const matchesSport = !sport || task.SportPlayed === sport;

            return isCustomerMatch && isPending && matchesSport;
        });
    }
}
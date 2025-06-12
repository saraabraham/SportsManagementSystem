// src/app/components/fixtures/fixtures.component.ts
// Fixed tooltip implementation with proper modal-style display

import { Component, OnInit, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FixturesService } from '../../services/fixtures.service';
import { DashboardService } from '../../services/dashboard.service';
import {
    TimeSlot,
    Attendee,
    DayOfWeek,
    CreateTimeSlotRequest,
    AddAttendeeRequest,
    DAYS_OF_WEEK
} from '../../models/fixtures.model';

import { TaskItem, SPORTS_OPTIONS } from '../../models/task.model';
import { TaskItemStatus } from '../../enums/task-item-status.enum';

interface WeekDay {
    name: string;
    date: Date;
    dayOfWeek: DayOfWeek;
}

@Component({
    selector: 'app-fixtures',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './fixtures.component.html',
    styleUrls: ['./fixtures.component.css']
})
export class FixturesComponent implements OnInit {
    protected fixturesService = inject(FixturesService);
    private dashboardService = inject(DashboardService);

    // Output events for navigation to task management
    @Output() navigateToTask = new EventEmitter<number>();
    @Output() switchToTaskManagement = new EventEmitter<void>();
    @Output() navigateToTaskWithCustomer = new EventEmitter<{ taskId: number, customerName: string }>();

    // Signals for component state
    currentWeekStart = signal<Date>(new Date());
    showTimeSlotModal = signal(false);
    showAttendeeModal = signal(false);
    editingTimeSlot = signal<TimeSlot | null>(null);
    selectedTimeSlot = signal<TimeSlot | null>(null);
    selectedSport = signal<string>('');

    // FIXED: Task tooltip signals - using modal approach
    showTasksTooltip = signal(false);
    selectedAttendee = signal<Attendee | null>(null);
    attendeeTasks = signal<TaskItem[]>([]);
    tooltipPosition = signal<{ x: number, y: number }>({ x: 0, y: 0 });

    // Form data
    timeSlotFormData: any = this.getEmptyTimeSlotForm();
    attendeeFormData: any = this.getEmptyAttendeeForm();

    // Options - Properly typed arrays
    daysOfWeek: DayOfWeek[] = [...DAYS_OF_WEEK];
    sportsOptions: string[] = [...SPORTS_OPTIONS];

    // Computed properties
    weekDays = computed(() => {
        const startDate = this.currentWeekStart();
        const days: WeekDay[] = [];

        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);

            days.push({
                name: this.daysOfWeek[i],
                date: date,
                dayOfWeek: this.daysOfWeek[i]
            });
        }

        return days;
    });

    ngOnInit(): void {
        this.goToCurrentWeek();
    }

    // Template helper methods for signal access
    getWeekDays(): WeekDay[] {
        return this.weekDays();
    }

    // Get available sports from current week's time slots
    getAvailableSports(): string[] {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) {
            return [];
        }

        const sports = [...new Set(schedule.timeSlots.map((slot: TimeSlot) => slot.sport))] as string[];
        return sports.sort();
    }

    // Filter time slots by selected sport
    getFilteredTimeSlotsForDay(dayOfWeek: DayOfWeek): TimeSlot[] {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return [];

        let timeSlots = schedule.timeSlots.filter((slot: TimeSlot) => slot.dayOfWeek === dayOfWeek);

        // Apply sport filter if selected
        const sportFilter = this.selectedSport();
        if (sportFilter) {
            timeSlots = timeSlots.filter((slot: TimeSlot) => slot.sport === sportFilter);
        }

        return timeSlots.sort((a: TimeSlot, b: TimeSlot) => a.startTime.localeCompare(b.startTime));
    }

    // Sport filter methods
    onSportFilterChange(): void {
        console.log('Sport filter changed to:', this.selectedSport());
    }

    clearSportFilter(): void {
        this.selectedSport.set('');
    }

    // Template helper methods for TaskItem properties
    getTaskId(task: TaskItem): number {
        return task.Id;
    }

    getTaskName(task: TaskItem): string {
        return task.Name;
    }

    getTaskStatus(task: TaskItem): TaskItemStatus {
        return task.Status;
    }

    getTaskCustomer(task: TaskItem): string {
        return task.Customer;
    }

    getTaskDeadline(task: TaskItem): string {
        return task.Deadline;
    }

    getTaskSportPlayed(task: TaskItem): string {
        return task.SportPlayed;
    }

    getTaskPercentCompleted(task: TaskItem): number {
        return task.PercentCompleted;
    }

    getTaskUpdates(task: TaskItem): string {
        return task.Updates;
    }

    // FIXED: Task badge click handler - shows modal-style tooltip
    onTaskBadgeClick(attendee: Attendee, event: MouseEvent): void {
        event.stopPropagation();
        console.log('Task badge clicked for customer:', attendee.name);

        // Load tasks for this customer
        const tasks = this.getCustomerPendingTasks(attendee.name, this.selectedSport());

        // Set tooltip data
        this.selectedAttendee.set(attendee);
        this.attendeeTasks.set(tasks);

        // Show tooltip modal
        this.showTasksTooltip.set(true);

        console.log('Showing tasks tooltip with', tasks.length, 'tasks');
    }

    // Close tooltip modal
    closeTasksTooltip(): void {
        this.showTasksTooltip.set(false);
        this.selectedAttendee.set(null);
        this.attendeeTasks.set([]);
    }

    // Navigate to specific task with customer filter
    onTaskClick(taskId: number): void {
        console.log('Task clicked:', taskId);

        const customerName = this.selectedAttendee()?.name;

        // Close tooltip
        this.closeTasksTooltip();

        // Navigate with customer filter
        if (customerName) {
            this.navigateToTaskWithCustomer.emit({ taskId, customerName });
        } else {
            this.navigateToTask.emit(taskId);
        }
        this.switchToTaskManagement.emit();
    }

    // Get customer pending tasks
    private getCustomerPendingTasks(customerName: string, sport?: string): TaskItem[] {
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) return [];

        return dashboardData.Tasks.filter((task: TaskItem) => {
            // Match by customer name
            const isCustomerMatch = task.Customer.toLowerCase() === customerName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;
            const matchesSport = !sport || task.SportPlayed === sport;

            return isCustomerMatch && isPending && matchesSport;
        });
    }

    getTaskPriorityClass(task: TaskItem): string {
        const daysUntilDeadline = this.getDaysUntilDeadline(task.Deadline);

        if (task.Status === TaskItemStatus.Late) return 'task-priority-overdue';
        if (daysUntilDeadline <= 1) return 'task-priority-urgent';
        if (daysUntilDeadline <= 3) return 'task-priority-high';
        if (daysUntilDeadline <= 7) return 'task-priority-medium';
        return 'task-priority-low';
    }

    private getDaysUntilDeadline(deadline: string): number {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadlineDate = new Date(deadline);
        deadlineDate.setHours(0, 0, 0, 0);

        const diffTime = deadlineDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getTaskStatusClass(status: TaskItemStatus): string {
        switch (status) {
            case TaskItemStatus.NotStarted:
                return 'not-started';
            case TaskItemStatus.InProgress:
                return 'in-progress';
            case TaskItemStatus.Late:
                return 'late';
            case TaskItemStatus.Completed:
                return 'completed';
            case TaskItemStatus.OnHold:
                return 'on-hold';
            case TaskItemStatus.Cancelled:
                return 'cancelled';
            default:
                return 'not-started';
        }
    }

    getTaskStatusText(status: TaskItemStatus): string {
        switch (status) {
            case TaskItemStatus.NotStarted:
                return 'Not Started';
            case TaskItemStatus.InProgress:
                return 'In Progress';
            case TaskItemStatus.Late:
                return 'Late';
            case TaskItemStatus.Completed:
                return 'Completed';
            case TaskItemStatus.OnHold:
                return 'On Hold';
            case TaskItemStatus.Cancelled:
                return 'Cancelled';
            default:
                return 'Unknown';
        }
    }

    // Form Data Helpers
    getEmptyTimeSlotForm() {
        return {
            dayOfWeek: '',
            sport: '',
            startTime: '',
            endTime: '',
            maxCapacity: 10,
            location: '',
            notes: ''
        };
    }

    getEmptyAttendeeForm() {
        return {
            name: '',
            email: '',
            phone: ''
        };
    }

    // Week Navigation
    goToCurrentWeek(): void {
        const currentWeek = this.fixturesService.getCurrentWeek();
        this.currentWeekStart.set(currentWeek);
        this.loadWeeklySchedule();
    }

    goToPreviousWeek(): void {
        const currentStart = this.currentWeekStart();
        const previousWeek = new Date(currentStart);
        previousWeek.setDate(currentStart.getDate() - 7);
        this.currentWeekStart.set(previousWeek);
        this.loadWeeklySchedule();
    }

    goToNextWeek(): void {
        const currentStart = this.currentWeekStart();
        const nextWeek = new Date(currentStart);
        nextWeek.setDate(currentStart.getDate() + 7);
        this.currentWeekStart.set(nextWeek);
        this.loadWeeklySchedule();
    }

    loadWeeklySchedule(): void {
        this.fixturesService.getWeeklySchedule(this.currentWeekStart()).subscribe({
            next: () => {
                console.log('Weekly schedule loaded successfully');
            },
            error: (error) => {
                console.error('Error loading weekly schedule:', error);
            }
        });
    }

    loadCurrentWeek(): void {
        this.goToCurrentWeek();
    }

    // Utility Methods
    formatWeekRange(): string {
        const startDate = this.currentWeekStart();
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric'
        };

        const start = startDate.toLocaleDateString('en-US', options);
        const end = endDate.toLocaleDateString('en-US', options);

        return `${start} - ${end}`;
    }

    formatDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    formatTime(date: Date | string): string {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    formatTaskDate(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getTimeSlotsForDay(dayOfWeek: DayOfWeek): TimeSlot[] {
        return this.getFilteredTimeSlotsForDay(dayOfWeek);
    }

    getPresentCount(timeSlot: TimeSlot): number {
        return timeSlot.attendees.filter((attendee: Attendee) => attendee.isPresent).length;
    }

    getSportIcon(sport: string): string {
        const sportIcons: Record<string, string> = {
            'Football': 'fas fa-football-ball',
            'Basketball': 'fas fa-basketball-ball',
            'Tennis': 'fas fa-table-tennis',
            'Swimming': 'fas fa-swimmer',
            'Cricket': 'fas fa-baseball-ball',
            'Running': 'fas fa-running',
            'Golf': 'fas fa-golf-ball',
            'Boxing': 'fas fa-fist-raised',
            'Volleyball': 'fas fa-volleyball-ball',
            'Cycling': 'fas fa-biking',
            'Baseball': 'fas fa-baseball-ball',
            'Soccer': 'fas fa-futbol',
            'Hockey': 'fas fa-hockey-puck',
            'Track & Field': 'fas fa-running',
            'Wrestling': 'fas fa-fist-raised',
            'Gymnastics': 'fas fa-child'
        };
        return sportIcons[sport] || 'fas fa-trophy';
    }

    // Time Slot Management
    openCreateTimeSlotModal(): void {
        this.editingTimeSlot.set(null);
        this.timeSlotFormData = this.getEmptyTimeSlotForm();
        this.showTimeSlotModal.set(true);
    }

    editTimeSlot(timeSlot: TimeSlot): void {
        this.editingTimeSlot.set(timeSlot);
        this.timeSlotFormData = {
            dayOfWeek: timeSlot.dayOfWeek,
            sport: timeSlot.sport,
            startTime: timeSlot.startTime,
            endTime: timeSlot.endTime,
            maxCapacity: timeSlot.maxCapacity || 10,
            location: timeSlot.location || '',
            notes: timeSlot.notes || ''
        };
        this.showTimeSlotModal.set(true);
    }

    closeTimeSlotModal(): void {
        this.showTimeSlotModal.set(false);
        this.editingTimeSlot.set(null);
        this.timeSlotFormData = this.getEmptyTimeSlotForm();
    }

    saveTimeSlot(): void {
        const request: CreateTimeSlotRequest = {
            dayOfWeek: this.timeSlotFormData.dayOfWeek,
            sport: this.timeSlotFormData.sport,
            startTime: this.timeSlotFormData.startTime,
            endTime: this.timeSlotFormData.endTime,
            maxCapacity: this.timeSlotFormData.maxCapacity,
            location: this.timeSlotFormData.location,
            notes: this.timeSlotFormData.notes
        };

        if (this.editingTimeSlot()) {
            console.log('Updating time slot:', request);
            // For now, since update isn't implemented in backend, show message
            alert('Time slot update functionality will be implemented soon!');
            this.closeTimeSlotModal();
        } else {
            this.fixturesService.createTimeSlot(request).subscribe({
                next: () => {
                    console.log('Time slot created successfully');
                    this.closeTimeSlotModal();
                    // Reload the schedule to show the new time slot
                    this.loadWeeklySchedule();
                    alert('Time slot created successfully!');
                },
                error: (error) => {
                    console.error('Error creating time slot:', error);
                    alert('Failed to create time slot. Please try again.');
                }
            });
        }
    }

    deleteTimeSlot(timeSlotId: string): void {
        if (confirm('Are you sure you want to delete this time slot? All attendee data will be lost.')) {
            this.fixturesService.deleteTimeSlot(timeSlotId).subscribe({
                next: () => {
                    console.log('Time slot deleted successfully');
                    // Reload the schedule to reflect the deletion
                    this.loadWeeklySchedule();
                    alert('Time slot deleted successfully!');
                },
                error: (error) => {
                    console.error('Error deleting time slot:', error);
                    alert('Failed to delete time slot. Please try again.');
                }
            });
        }
    }

    // Attendee/Customer Management
    openAddAttendeeModal(timeSlot: TimeSlot): void {
        this.selectedTimeSlot.set(timeSlot);
        this.attendeeFormData = this.getEmptyAttendeeForm();
        this.showAttendeeModal.set(true);
    }

    closeAttendeeModal(): void {
        this.showAttendeeModal.set(false);
        this.selectedTimeSlot.set(null);
        this.attendeeFormData = this.getEmptyAttendeeForm();
    }

    saveAttendee(): void {
        const timeSlot = this.selectedTimeSlot();
        if (!timeSlot) {
            console.error('No time slot selected');
            alert('No time slot selected. Please try again.');
            return;
        }

        const attendeeName = this.attendeeFormData.name?.trim();
        if (!attendeeName) {
            alert('Attendee name is required');
            return;
        }

        // Check if attendee already exists in this time slot
        const existingAttendee = timeSlot.attendees.find(a =>
            a.name.toLowerCase() === attendeeName.toLowerCase()
        );

        if (existingAttendee) {
            alert('This attendee is already registered for this time slot');
            return;
        }

        console.log('=== SAVING ATTENDEE ===');
        console.log('Selected TimeSlot:', timeSlot);
        console.log('TimeSlot ID:', timeSlot.id, 'Type:', typeof timeSlot.id);

        // Convert to number if needed
        const timeSlotId = parseInt(timeSlot.id.toString(), 10);

        if (isNaN(timeSlotId) || timeSlotId <= 0) {
            console.error('Invalid time slot ID:', timeSlot.id);
            alert('Invalid time slot ID. Please refresh the page and try again.');
            return;
        }

        console.log('Converted TimeSlot ID:', timeSlotId);

        const request: AddAttendeeRequest = {
            timeSlotId: timeSlotId,
            name: attendeeName,
            email: this.attendeeFormData.email?.trim() || '',
            phone: this.attendeeFormData.phone?.trim() || ''
        };

        console.log('Final request object:', request);

        this.fixturesService.addAttendee(request).subscribe({
            next: (response) => {
                console.log('✅ SUCCESS: Attendee added');
                console.log('Response:', response);
                this.closeAttendeeModal();
                // Reload the schedule to show the new attendee
                this.loadWeeklySchedule();
                alert('Attendee added successfully!');
            },
            error: (error) => {
                console.error('❌ ERROR adding attendee:', error);

                let errorMessage = 'Failed to add attendee.\n';
                if (error.error?.message) {
                    errorMessage += error.error.message;
                } else if (error.status === 400) {
                    errorMessage += 'Invalid request data. Please check the form and try again.';
                } else if (error.status === 500) {
                    errorMessage += 'Server error occurred. Please try again later.';
                } else {
                    errorMessage += 'Unknown error occurred. Please try again.';
                }

                alert(errorMessage);
            }
        });
    }

    // FIXED: Proper toggle functionality with unique attendee identification
    toggleAttendance(timeSlotId: string, attendee: Attendee, event: Event): void {
        event.stopPropagation();
        event.preventDefault();

        console.log('=== TOGGLE ATTENDANCE ===');
        console.log('Time Slot ID:', timeSlotId);
        console.log('Attendee:', attendee.name, 'ID:', attendee.id);
        console.log('Current state:', attendee.isPresent);

        // Find the specific time slot and attendee to ensure we're working with the right objects
        const currentSchedule = this.fixturesService.currentWeekSchedule();
        if (!currentSchedule) {
            console.error('No current schedule available');
            return;
        }

        const timeSlot = currentSchedule.timeSlots.find(ts => ts.id === timeSlotId);
        if (!timeSlot) {
            console.error('Time slot not found:', timeSlotId);
            return;
        }

        const targetAttendee = timeSlot.attendees.find(a => a.id === attendee.id);
        if (!targetAttendee) {
            console.error('Attendee not found:', attendee.id);
            return;
        }

        // Store original state for rollback
        const originalState = targetAttendee.isPresent;
        const originalCheckIn = targetAttendee.checkedInAt;

        // Toggle the state optimistically
        const newState = !originalState;
        targetAttendee.isPresent = newState;
        targetAttendee.checkedInAt = newState ? new Date() : undefined;

        console.log('Updated state:', newState);

        // Create attendance update object
        const update = {
            timeSlotId,
            attendeeId: attendee.id,
            isPresent: newState,
            checkedInAt: newState ? new Date() : undefined
        };

        this.fixturesService.updateAttendance(update).subscribe({
            next: () => {
                console.log('✅ Attendance updated successfully for:', targetAttendee.name);
                // Success - the optimistic update is already applied
            },
            error: (error) => {
                console.error('❌ Error updating attendance:', error);
                // Rollback on error
                targetAttendee.isPresent = originalState;
                targetAttendee.checkedInAt = originalCheckIn;
                alert('Failed to update attendance. Please try again.');
            }
        });
    }

    removeAttendee(timeSlotId: string, attendeeId: string, event: Event): void {
        event.stopPropagation();

        if (confirm('Are you sure you want to remove this attendee?')) {
            this.fixturesService.removeAttendee(timeSlotId, attendeeId).subscribe({
                next: () => {
                    console.log('Attendee removed successfully');
                    // Reload the schedule to reflect the removal
                    this.loadWeeklySchedule();
                },
                error: (error) => {
                    console.error('Error removing attendee:', error);
                    alert('Failed to remove attendee. Please try again.');
                }
            });
        }
    }
}
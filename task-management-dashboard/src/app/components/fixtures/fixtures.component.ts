// src/app/components/fixtures/fixtures.component.ts
// Fixed component with proper toggle functionality and scoped updates

import { Component, OnInit, inject, signal, computed, Output, EventEmitter, Renderer2 } from '@angular/core';
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
    private renderer: Renderer2;

    constructor(renderer: Renderer2) {
        this.renderer = renderer;
    }
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

    // Updated hover functionality - only for task badge
    hoveredTaskBadge = signal<string | null>(null);
    badgeHoverTasks = signal<TaskItem[]>([]);

    // Task modal signals
    showTasksModal = signal(false);
    selectedAttendee = signal<Attendee | null>(null);
    attendeeTasks = signal<TaskItem[]>([]);

    // FIXED: Make form data reactive signals
    timeSlotFormData = signal<any>(this.getEmptyTimeSlotForm());
    attendeeFormData = signal<any>(this.getEmptyAttendeeForm());

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
        this.updateAttendeeTaskCounts();
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
        // Sport filter change will automatically trigger reactive updates
        console.log('Sport filter changed to:', this.selectedSport());
    }

    clearSportFilter(): void {
        this.selectedSport.set('');
        this.updateAttendeeTaskCounts();
    }

    private updateAttendeeTaskCounts(): void {
        console.log('Updating attendee task counts with customer-based logic...');
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return;

        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) return;

        const selectedSport = this.selectedSport();

        schedule.timeSlots.forEach((timeSlot: TimeSlot) => {
            timeSlot.attendees.forEach((attendee: Attendee) => {
                // Count tasks where Customer name matches attendee name
                const pendingTasks = this.getCustomerPendingTasksForSport(attendee.name, selectedSport);
                attendee.pendingTasksCount = pendingTasks.length;
                console.log(`Customer ${attendee.name} has ${pendingTasks.length} pending tasks`);
            });
        });
    }

    // Updated to use Customer field instead of AssignedTo
    private getCustomerPendingTasksForSport(customerName: string, sport?: string): TaskItem[] {
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

    // Updated hover functionality - only for task badges
    isTaskBadgeHovered(badgeId: string): boolean {
        return this.hoveredTaskBadge() === badgeId;
    }

    getHoverTasks(): TaskItem[] {
        return this.badgeHoverTasks();
    }

    // Updated badge hover methods - specific to task count badge only
    onBadgeHover(attendee: Attendee, event: MouseEvent): void {
        event.stopPropagation();
        console.log('Hovering over task badge for customer:', attendee.name);

        const badgeId = `badge_${attendee.id}`;
        this.hoveredTaskBadge.set(badgeId);
        this.loadCustomerTasksForHover(attendee.name, this.selectedSport());
    }

    onBadgeLeave(): void {
        console.log('Leaving task badge hover');
        this.hoveredTaskBadge.set(null);
        this.badgeHoverTasks.set([]);
    }

    // Updated to navigate with customer name for filtering
    onTaskClick(taskId: number, event: Event): void {
        event.stopPropagation();
        console.log('Task clicked:', taskId);

        // Get the customer name from the hovered badge
        const customerName = this.getCustomerNameFromHoveredBadge();

        // Close any open tooltips
        this.onBadgeLeave();

        // Emit events to navigate to task management with customer filter
        if (customerName) {
            this.navigateToTaskWithCustomer.emit({ taskId, customerName });
        } else {
            this.navigateToTask.emit(taskId);
        }
        this.switchToTaskManagement.emit();
    }

    private getCustomerNameFromHoveredBadge(): string | null {
        const hoveredBadgeId = this.hoveredTaskBadge();
        if (!hoveredBadgeId) return null;

        // Extract attendee ID from badge ID
        const attendeeId = hoveredBadgeId.replace('badge_', '');

        // Find the attendee in current schedule
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return null;

        for (const timeSlot of schedule.timeSlots) {
            const attendee = timeSlot.attendees.find(a => a.id === attendeeId);
            if (attendee) {
                return attendee.name;
            }
        }

        return null;
    }

    loadCustomerTasksForHover(customerName: string, sport?: string): void {
        console.log('Loading tasks for hover - Customer:', customerName, 'sport:', sport);
        const pendingTasks = this.getCustomerPendingTasksForSport(customerName, sport);
        console.log('Found pending tasks:', pendingTasks);
        this.badgeHoverTasks.set(pendingTasks);
    }

    getTasksForCustomer(customerName: string): TaskItem[] {
        return this.getCustomerPendingTasksForSport(customerName, this.selectedSport());
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

    // Task modal methods
    openTasksModal(attendee: Attendee): void {
        this.selectedAttendee.set(attendee);
        const tasks = this.getTasksForCustomer(attendee.name);
        this.attendeeTasks.set(tasks);
        this.showTasksModal.set(true);
    }

    closeTasksModal(): void {
        this.showTasksModal.set(false);
        this.selectedAttendee.set(null);
        this.attendeeTasks.set([]);
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

    getEmptyTimeSlotForm() {
        return {
            dayOfWeek: '',
            sport: '',
            startTime: '09:00',  // FIXED: Provide default time instead of empty string
            endTime: '10:00',    // FIXED: Provide default time instead of empty string
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
                this.updateAttendeeTaskCounts();
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
        this.timeSlotFormData.set(this.getEmptyTimeSlotForm());
        this.showTimeSlotModal.set(true);
        console.log('Create modal opened with data:', this.timeSlotFormData());
    }

    // FIXED: Enhanced edit time slot method
    editTimeSlot(timeSlot: TimeSlot): void {
        console.log('Editing time slot:', timeSlot);
        this.editingTimeSlot.set(timeSlot);

        // FIXED: Update the signal with the time slot data and ensure valid defaults
        this.timeSlotFormData.set({
            dayOfWeek: timeSlot.dayOfWeek || '',
            sport: timeSlot.sport || '',
            startTime: timeSlot.startTime || '09:00',
            endTime: timeSlot.endTime || '10:00',
            maxCapacity: timeSlot.maxCapacity || 10,
            location: timeSlot.location || '',
            notes: timeSlot.notes || ''
        });

        this.showTimeSlotModal.set(true);
        console.log('Edit modal opened with data:', this.timeSlotFormData());
    }

    closeTimeSlotModal(): void {
        this.showTimeSlotModal.set(false);
        this.editingTimeSlot.set(null);
        this.timeSlotFormData.set(this.getEmptyTimeSlotForm());
    }

    saveTimeSlot(): void {
        console.log('=== SAVING TIME SLOT ===');
        const formData = this.timeSlotFormData();
        console.log('Form data:', formData);

        // Validate required fields
        if (!formData.dayOfWeek || formData.dayOfWeek.trim() === '') {
            alert('Please select a day of the week');
            return;
        }

        if (!formData.sport || formData.sport.trim() === '') {
            alert('Please select a sport');
            return;
        }

        if (!formData.startTime || formData.startTime.trim() === '') {
            alert('Please select a start time');
            return;
        }

        if (!formData.endTime || formData.endTime.trim() === '') {
            alert('Please select an end time');
            return;
        }

        // Validate time format and logic
        const startTime = formData.startTime.trim();
        const endTime = formData.endTime.trim();

        if (!this.isValidTimeFormat(startTime)) {
            alert('Invalid start time format. Please use HH:MM format (e.g., 08:00)');
            return;
        }

        if (!this.isValidTimeFormat(endTime)) {
            alert('Invalid end time format. Please use HH:MM format (e.g., 09:00)');
            return;
        }

        if (startTime >= endTime) {
            alert('End time must be after start time');
            return;
        }

        const request: CreateTimeSlotRequest = {
            dayOfWeek: formData.dayOfWeek.trim(),
            sport: formData.sport.trim(),
            startTime: startTime,
            endTime: endTime,
            maxCapacity: formData.maxCapacity || 10,
            location: formData.location?.trim() || '',
            notes: formData.notes?.trim() || ''
        };

        console.log('Request payload:', request);

        if (this.editingTimeSlot()) {
            console.log('Updating time slot:', request);
            this.closeTimeSlotModal();
            alert('Time slot update functionality coming soon!');
        } else {
            this.fixturesService.createTimeSlot(request).subscribe({
                next: (response) => {
                    console.log('✅ Time slot created successfully:', response);
                    this.closeTimeSlotModal();
                    alert('Time slot created successfully!');
                    // Refresh the schedule to show the new time slot
                    this.loadWeeklySchedule();
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
                },
                error: (error) => {
                    console.error('Error deleting time slot:', error);
                }
            });
        }
    }

    private isValidTimeFormat(time: string): boolean {
        if (!time || time.trim() === '') {
            return false;
        }
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time.trim());
    }

    // Attendee/Customer Management
    openAddAttendeeModal(timeSlot: TimeSlot): void {
        this.selectedTimeSlot.set(timeSlot);
        this.attendeeFormData.set(this.getEmptyAttendeeForm());
        this.showAttendeeModal.set(true);
    }

    closeAttendeeModal(): void {
        this.showAttendeeModal.set(false);
        this.selectedTimeSlot.set(null);
        this.attendeeFormData.set(this.getEmptyAttendeeForm());
    }

    saveAttendee(): void {
        const timeSlot = this.selectedTimeSlot();
        if (!timeSlot) {
            console.error('No time slot selected');
            return;
        }

        const formData = this.attendeeFormData();
        const attendeeName = formData.name?.trim();
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

        const request: AddAttendeeRequest = {
            timeSlotId: timeSlot.id,
            name: attendeeName,
            contactInfo: {
                email: formData.email?.trim() || undefined,
                phone: formData.phone?.trim() || undefined
            }
        };

        console.log('Adding attendee:', request);

        this.fixturesService.addAttendee(request).subscribe({
            next: () => {
                console.log('Attendee added successfully');
                this.closeAttendeeModal();
                alert('Attendee added successfully!');
            },
            error: (error) => {
                console.error('Error adding attendee:', error);
                alert('Failed to add attendee. Please try again.');
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

        // Toggle the state
        const newState = !originalState;
        targetAttendee.isPresent = newState;
        targetAttendee.checkedInAt = newState ? new Date() : undefined;

        console.log('Updated state:', newState);

        const update = {
            timeSlotId,
            attendeeId: attendee.id,
            isPresent: newState,
            checkedInAt: newState ? new Date() : undefined
        };

        this.fixturesService.updateAttendance(update).subscribe({
            next: () => {
                console.log('✅ Attendance updated successfully for:', targetAttendee.name);
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
                },
                error: (error) => {
                    console.error('Error removing attendee:', error);
                }
            });
        }
    }
    updateTimeSlotFormData(field: string, event: Event): void {
        const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const value = target.value;

        console.log(`Updating ${field} with value:`, value);

        this.timeSlotFormData.update(data => {
            const newData = { ...data };
            if (field === 'maxCapacity') {
                newData[field] = parseInt(value) || 10;
            } else {
                newData[field] = value;
            }
            console.log('Updated form data:', newData);
            return newData;
        });
    }

    updateAttendeeFormData(field: string, event: Event): void {
        const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const value = target.value;

        this.attendeeFormData.update(data => ({
            ...data,
            [field]: value
        }));
    }
}
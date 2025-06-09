// src/app/components/fixtures/fixtures.component.ts
// Complete updated component with simple hover tooltip

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

    // Signals for component state
    currentWeekStart = signal<Date>(new Date());
    showTimeSlotModal = signal(false);
    showAttendeeModal = signal(false);
    editingTimeSlot = signal<TimeSlot | null>(null);
    selectedTimeSlot = signal<TimeSlot | null>(null);
    selectedSport = signal<string>('');
    hoveredAttendee = signal<string | null>(null);
    attendeeHoverTasks = signal<TaskItem[]>([]);

    // Task modal signals
    showTasksModal = signal(false);
    selectedAttendee = signal<Attendee | null>(null);
    attendeeTasks = signal<TaskItem[]>([]);

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

        // Explicitly cast 'slot.sport' to string if TimeSlot.sport is 'any' or 'unknown'
        // or ensure TimeSlot.sport is typed as 'string'
        // Or, more directly, cast the result of the map operation or the Set conversion.

        // Option 1: Cast the result of the map operation (safer if TimeSlot.sport is string)
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
        this.updateAttendeeTaskCounts();
    }

    clearSportFilter(): void {
        this.selectedSport.set('');
        this.updateAttendeeTaskCounts();
    }

    private updateAttendeeTaskCounts(): void {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return;

        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) return;

        const selectedSport = this.selectedSport();

        schedule.timeSlots.forEach((timeSlot: TimeSlot) => {
            timeSlot.attendees.forEach((attendee: Attendee) => {
                const pendingTasks = this.getAttendeePendingTasksForSport(attendee.name, selectedSport);
                attendee.pendingTasksCount = pendingTasks.length;
            });
        });
    }

    private getAttendeePendingTasksForSport(attendeeName: string, sport?: string): TaskItem[] {
        const dashboardData = this.dashboardService.dashboardData();
        if (!dashboardData?.Tasks) return [];

        return dashboardData.Tasks.filter((task: TaskItem) => {
            const isAssignedToAttendee = task.AssignedTo.toLowerCase() === attendeeName.toLowerCase();
            const isPending = task.Status === TaskItemStatus.NotStarted ||
                task.Status === TaskItemStatus.InProgress ||
                task.Status === TaskItemStatus.Late;
            const matchesSport = !sport || task.SportPlayed === sport;

            return isAssignedToAttendee && isPending && matchesSport;
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

    // Helper methods for hover functionality
    isAttendeeHovered(attendeeId: string): boolean {
        return this.hoveredAttendee() === attendeeId;
    }

    getHoverTasks(): TaskItem[] {
        return this.attendeeHoverTasks();
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
        const tasks = this.getTasksForAttendee(attendee.name);
        this.attendeeTasks.set(tasks);
        this.showTasksModal.set(true);
    }

    closeTasksModal(): void {
        this.showTasksModal.set(false);
        this.selectedAttendee.set(null);
        this.attendeeTasks.set([]);
    }

    // Simple hover methods (no complex portal tooltip)
    onAttendeeHover(attendee: Attendee, event: MouseEvent): void {
        this.hoveredAttendee.set(attendee.id);
        this.loadAttendeeTasksForHover(attendee.name, this.selectedSport());
    }

    onAttendeeLeave(): void {
        this.hoveredAttendee.set(null);
        this.attendeeHoverTasks.set([]);
    }

    onTaskClick(taskId: number, event: Event): void {
        event.stopPropagation();
        this.navigateToTask.emit(taskId);
        this.switchToTaskManagement.emit();
    }

    loadAttendeeTasksForHover(attendeeName: string, sport?: string): void {
        const pendingTasks = this.getAttendeePendingTasksForSport(attendeeName, sport);
        this.attendeeHoverTasks.set(pendingTasks);
    }

    getTasksForAttendee(attendeeName: string): TaskItem[] {
        return this.getAttendeePendingTasksForSport(attendeeName, this.selectedSport());
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

    // Bulk Operations
    markAllPresent(timeSlot: TimeSlot): void {
        if (confirm('Mark all attendees as present?')) {
            timeSlot.attendees.forEach((attendee: Attendee) => {
                if (!attendee.isPresent) {
                    this.toggleAttendance(timeSlot.id, attendee, new Event('click'));
                }
            });
        }
    }

    markAllAbsent(timeSlot: TimeSlot): void {
        if (confirm('Mark all attendees as absent?')) {
            timeSlot.attendees.forEach((attendee: Attendee) => {
                if (attendee.isPresent) {
                    this.toggleAttendance(timeSlot.id, attendee, new Event('click'));
                }
            });
        }
    }

    exportAttendanceReport(): void {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return;

        let report = `Weekly Attendance Report\n`;
        report += `Week: ${this.formatWeekRange()}\n\n`;

        schedule.timeSlots.forEach((timeSlot: TimeSlot) => {
            report += `${timeSlot.dayOfWeek} - ${this.fixturesService.formatTimeRange(timeSlot.startTime, timeSlot.endTime)}\n`;
            report += `Sport: ${timeSlot.sport}\n`;
            if (timeSlot.location) {
                report += `Location: ${timeSlot.location}\n`;
            }
            report += `Attendees (${this.getPresentCount(timeSlot)}/${timeSlot.attendees.length} present):\n`;

            timeSlot.attendees.forEach((attendee: Attendee) => {
                const status = attendee.isPresent ? '✓ Present' : '✗ Absent';
                const checkIn = attendee.checkedInAt ? ` (${this.formatTime(attendee.checkedInAt)})` : '';
                report += ` - ${attendee.name}: ${status}${checkIn}\n`;
            });

            report += '\n';
        });

        // Create and download the report
        const blob = new Blob([report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance-report-${this.formatWeekRange().replace(/\s/g, '-')}.txt`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    // Quick Actions
    addQuickTimeSlot(dayOfWeek: DayOfWeek): void {
        this.timeSlotFormData = {
            dayOfWeek: dayOfWeek,
            sport: 'Football', // Default sport
            startTime: '09:00',
            endTime: '10:00',
            maxCapacity: 20,
            location: '',
            notes: ''
        };
        this.showTimeSlotModal.set(true);
    }

    duplicateTimeSlot(timeSlot: TimeSlot): void {
        this.timeSlotFormData = {
            dayOfWeek: timeSlot.dayOfWeek,
            sport: timeSlot.sport,
            startTime: timeSlot.endTime, // Start where the previous one ended
            endTime: this.addHourToTime(timeSlot.endTime),
            maxCapacity: timeSlot.maxCapacity,
            location: timeSlot.location,
            notes: timeSlot.notes
        };
        this.showTimeSlotModal.set(true);
    }

    private addHourToTime(time: string): string {
        const [hours, minutes] = time.split(':').map(Number);
        const newHours = (hours + 1) % 24;
        return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Statistics
    getWeeklyStats() {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return null;

        const totalSlots = schedule.timeSlots.length;
        const totalAttendees = schedule.timeSlots.reduce((sum: number, slot: TimeSlot) => sum + slot.attendees.length, 0);
        const totalPresent = schedule.timeSlots.reduce((sum: number, slot: TimeSlot) => sum + this.getPresentCount(slot), 0);
        const attendanceRate = totalAttendees > 0 ? Math.round((totalPresent / totalAttendees) * 100) : 0;

        const sportStats = schedule.timeSlots.reduce((stats: Record<string, number>, slot: TimeSlot) => {
            stats[slot.sport] = (stats[slot.sport] || 0) + 1;
            return stats;
        }, {} as Record<string, number>);

        return {
            totalSlots,
            totalAttendees,
            totalPresent,
            attendanceRate,
            sportStats
        };
    }

    // Search and Filter
    searchAttendees(searchTerm: string): void {
        // Implementation for searching attendees across all time slots
    }

    filterByCapacity(minCapacity: number): TimeSlot[] {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return [];

        return schedule.timeSlots.filter((slot: TimeSlot) =>
            (slot.maxCapacity || 0) >= minCapacity
        );
    }

    getOvercapacitySlots(): TimeSlot[] {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return [];

        return schedule.timeSlots.filter((slot: TimeSlot) =>
            slot.maxCapacity && slot.attendees.length > slot.maxCapacity
        );
    }

    getUnderfilledSlots(): TimeSlot[] {
        const schedule = this.fixturesService.currentWeekSchedule();
        if (!schedule) return [];

        return schedule.timeSlots.filter((slot: TimeSlot) =>
            slot.maxCapacity && slot.attendees.length < slot.maxCapacity * 0.5
        );
    }

    // Notification helpers (for future integration)
    notifyLateAttendees(): void {
        console.log('Notification feature coming soon');
    }

    sendWeeklyReminder(): void {
        console.log('Weekly reminder feature coming soon');
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
            this.closeTimeSlotModal();
        } else {
            this.fixturesService.createTimeSlot(request).subscribe({
                next: () => {
                    console.log('Time slot created successfully');
                    this.closeTimeSlotModal();
                },
                error: (error) => {
                    console.error('Error creating time slot:', error);
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

    // Attendee Management
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
        if (!timeSlot) return;

        const request: AddAttendeeRequest = {
            timeSlotId: timeSlot.id,
            name: this.attendeeFormData.name,
            contactInfo: {
                email: this.attendeeFormData.email || undefined,
                phone: this.attendeeFormData.phone || undefined
            }
        };

        this.fixturesService.addAttendee(request).subscribe({
            next: () => {
                console.log('Attendee added successfully');
                this.closeAttendeeModal();
            },
            error: (error) => {
                console.error('Error adding attendee:', error);
            }
        });
    }

    toggleAttendance(timeSlotId: string, attendee: Attendee, event: Event): void {
        event.stopPropagation();

        const update = {
            timeSlotId,
            attendeeId: attendee.id,
            isPresent: !attendee.isPresent,
            checkedInAt: !attendee.isPresent ? new Date() : undefined
        };

        this.fixturesService.updateAttendance(update).subscribe({
            next: () => {
                console.log('Attendance updated successfully');
            },
            error: (error) => {
                console.error('Error updating attendance:', error);
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
}
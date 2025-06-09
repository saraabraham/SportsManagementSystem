import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData, TaskItem, TaskGroup } from '../../models/task.model';
import { TaskItemStatus } from '../../enums/task-item-status.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  protected dashboardService = inject(DashboardService);

  public dashboardData = this.dashboardService.dashboardData;

  public dateFilterType = signal('all'); // 'all', 'today', 'single', 'range'
  public statusFilterType = signal<TaskItemStatus | 'all'>('all');
  public singleDate = signal('');
  public fromDate = signal('');
  public toDate = signal('');

  protected readonly TaskItemStatus = TaskItemStatus;

  filteredTasks = computed(() => {
    const tasks = this.dashboardData()?.Tasks || [];
    return this.filterTasks(tasks);
  });

  filteredTaskGroups = computed(() => {
    const filteredTasks = this.filteredTasks();
    if (!filteredTasks.length) return [];

    const groups = filteredTasks.reduce((acc: Record<string, TaskItem[]>, task) => {
      if (!acc[task.GroupTask]) {
        acc[task.GroupTask] = [];
      }
      acc[task.GroupTask].push(task);
      return acc;
    }, {});

    return Object.entries(groups).map(([name, tasks]) => ({ name, tasks }));
  });

  filteredTasksCount = computed(() => this.filteredTasks().length);
  totalTasksCount = computed(() => this.dashboardData()?.Tasks?.length || 0);

  private dataEffect = effect(() => {
    const data = this.dashboardData();
    if (data) {
      console.log('Dashboard data updated:', data);
    }
  });

  private filterReactivityEffect = effect(() => {
    console.log('--- Filter reactivity effect triggered ---');
    console.log('Current statusFilterType signal value:', this.statusFilterType());
    console.log('Current dateFilterType signal value:', this.dateFilterType());
  });


  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.dashboardService.getDashboardData().subscribe({
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  retryLoad(): void {
    this.loadDashboardData();
  }

  onFilterChange(): void {
    console.log('Filters changed:', {
      dateType: this.dateFilterType(),
      statusType: this.statusFilterType(),
      single: this.singleDate(),
      from: this.fromDate(),
      to: this.toDate()
    });
  }


  private filterTasks(tasks: TaskItem[]): TaskItem[] {
    console.log('--- filterTasks called ---');
    console.log('Initial tasks received by filterTasks:', tasks.length, tasks);

    const dateType = this.dateFilterType();
    const singleDateVal = this.singleDate();
    const fromDateVal = this.fromDate();
    const toDateVal = this.toDate();
    const statusTypeVal = this.statusFilterType();

    console.log('Current Date Filter Type:', dateType);
    if (dateType === 'single') {
      console.log('Single Date Input:', singleDateVal);
    } else if (dateType === 'range') {
      console.log('From Date Input:', fromDateVal);
      console.log('To Date Input:', toDateVal);
    } else if (dateType === 'today') { // ADDED THIS BLOCK
      console.log('Date Filter Type: TODAY.');
    }
    console.log('Current Status Filter Type:', statusTypeVal);


    let filtered = tasks;

    // --- Apply Date Filter ---
    if (dateType === 'single' && singleDateVal) {
      console.log('Applying SINGLE DATE filter...');
      const selectedDate = new Date(singleDateVal);
      const selectedDateUTC = Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

      filtered = filtered.filter(task => {
        const taskDate = new Date(task.Deadline);
        const taskDateUTC = Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        return taskDateUTC === selectedDateUTC;
      });
      console.log('After SINGLE DATE filter, tasks remaining:', filtered.length, filtered);

    } else if (dateType === 'range' && fromDateVal && toDateVal) {
      console.log('Applying DATE RANGE filter...');
      const from = new Date(fromDateVal);
      const to = new Date(toDateVal);
      const fromDateUTC = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
      const toDateUTC = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());

      filtered = filtered.filter(task => {
        const taskDate = new Date(task.Deadline);
        const taskDateUTC = Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        return taskDateUTC >= fromDateUTC && taskDateUTC <= toDateUTC;
      });
      console.log('After DATE RANGE filter, tasks remaining:', filtered.length, filtered);

    } else if (dateType === 'today') { // ADDED THIS BLOCK
      console.log('Applying TODAY filter...');
      const today = new Date();
      // Normalize today's date to UTC midnight for consistent comparison
      const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

      filtered = filtered.filter(task => {
        const taskDate = new Date(task.Deadline);
        // Normalize task deadline to UTC midnight
        const taskDateUTC = Date.UTC(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
        const isTodayMatch = taskDateUTC === todayUTC;
        console.log(`  Task ID: ${task.Id}, Deadline: ${task.Deadline}, Task UTC: ${taskDateUTC}, Today UTC: ${todayUTC}, Match: ${isTodayMatch}`);
        return isTodayMatch;
      });
      console.log('After TODAY filter, tasks remaining:', filtered.length, filtered);

    } else if (dateType === 'all') {
      console.log('Date Filter Type is ALL. No date filtering applied at this stage.');
    }


    // --- Apply Status Filter (after date filter) ---
    if (statusTypeVal !== 'all') {
      console.log(`Applying STATUS filter for: ${statusTypeVal}`);
      filtered = filtered.filter(task => {
        const isStatusMatch = task.Status === statusTypeVal;
        console.log(`  Task ID: ${task.Id}, Name: ${task.Name}, Status: "${task.Status}", Filter Status: "${statusTypeVal}"`);
        console.log(`    Status Match Result: ${isStatusMatch}`);
        return isStatusMatch;
      });
      console.log('After STATUS filter, tasks remaining:', filtered.length, filtered);
    } else {
      console.log('Status Filter Type is ALL. No status filtering applied.');
    }

    console.log('Final filtered tasks count:', filtered.length);
    console.log('Final filtered tasks array:', filtered);
    console.log('--- filterTasks finished ---');
    return filtered;
  }
  getCurrentDate(): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    };
    return new Date().toLocaleDateString('en-US', options);
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    };
    return d.toLocaleDateString('en-US', options);
  }

  getTaskRowClass(task: TaskItem): string {
    switch (task.Status) {
      case TaskItemStatus.Late:
        return 'late';
      case TaskItemStatus.Completed:
        return 'completed';
      case TaskItemStatus.OnHold:
        return 'on-hold';
      case TaskItemStatus.Cancelled:
        return 'cancelled';
      default:
        return '';
    }
  }

  getStatusClass(status: TaskItemStatus): string {
    switch (status) {
      case TaskItemStatus.NotStarted:
        return 'status-not-started';
      case TaskItemStatus.InProgress:
        return 'status-in-progress';
      case TaskItemStatus.Late:
        return 'status-late';
      case TaskItemStatus.Completed:
        return 'status-completed';
      case TaskItemStatus.OnHold:
        return 'status-on-hold';
      case TaskItemStatus.Cancelled:
        return 'status-cancelled';
      default:
        return 'status-unknown';
    }
  }

  getStatusText(status: TaskItemStatus): string {
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
        return 'Unknown Status';
    }
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

  getResourceWorkloadPercentage(type: 'done' | 'todo'): number {
    const data = this.dashboardData();
    if (!data?.ResourceWorkload) return 0;

    const total = data.ResourceWorkload.Done + data.ResourceWorkload.LeftToDo;
    if (total === 0) return 0;

    if (type === 'done') {
      return (data.ResourceWorkload.Done / total) * 100;
    } else {
      return (data.ResourceWorkload.LeftToDo / total) * 100;
    }
  }

  getTaskCompletionDashArray(type: 'onTrack' | 'late'): string {
    const data = this.dashboardData();
    if (!data?.TaskCompletion) return '0 100';

    const total = this.dashboardService.totalTasks();
    if (total === 0) return '0 100';

    if (type === 'onTrack') {
      const percentage = (data.TaskCompletion.OnTrack / total) * 100;
      return `${percentage} ${100 - percentage}`;
    } else {
      const percentage = (data.TaskCompletion.Late / total) * 100;
      return `${percentage} ${100 - percentage}`;
    }
  }

  getActiveTasksDashArray(type: 'completed' | 'inProgress' | 'notStarted'): string {
    const data = this.dashboardData();
    if (!data?.ActiveTasks) return '0 100';

    const total = data.ActiveTasks.Completed +
      data.ActiveTasks.InProgress +
      data.ActiveTasks.NotStarted;

    if (total === 0) return '0 100';

    let value = 0;
    switch (type) {
      case 'completed':
        value = data.ActiveTasks.Completed;
        break;
      case 'inProgress':
        value = data.ActiveTasks.InProgress;
        break;
      case 'notStarted':
        value = data.ActiveTasks.NotStarted;
        break;
    }

    const percentage = (value / total) * 100;
    return `${percentage} ${100 - percentage}`;
  }
}
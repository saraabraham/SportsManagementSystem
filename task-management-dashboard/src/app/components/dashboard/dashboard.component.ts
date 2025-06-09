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

  // Signals for component state
  public dashboardData = this.dashboardService.dashboardData;

  // Date filter properties
  dateFilterType = 'all';
  singleDate = '';
  fromDate = '';
  toDate = '';

  // Computed properties for filtered data
  filteredTasks = computed(() => {
    const tasks = this.dashboardData()?.Tasks || [];
    return this.filterTasksByDate(tasks);
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

  // Effect to handle data changes
  private dataEffect = effect(() => {
    const data = this.dashboardData();
    if (data) {
      console.log('Dashboard data updated:', data);
    }
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

  applyDateFilters(): void {
    // Filters are applied automatically through computed signal
    console.log('Date filters applied:', {
      type: this.dateFilterType,
      single: this.singleDate,
      from: this.fromDate,
      to: this.toDate
    });
  }

  private filterTasksByDate(tasks: TaskItem[]): TaskItem[] {
    if (this.dateFilterType === 'all') {
      return tasks;
    }

    if (this.dateFilterType === 'pending') {
      return tasks.filter(task =>
        task.Status === TaskItemStatus.NotStarted ||
        task.Status === TaskItemStatus.InProgress ||
        task.Status === TaskItemStatus.Late
      );
    }

    if (this.dateFilterType === 'single' && this.singleDate) {
      const selectedDate = new Date(this.singleDate);
      return tasks.filter(task => {
        const taskDate = new Date(task.Deadline);
        return taskDate.toDateString() === selectedDate.toDateString();
      });
    }

    if (this.dateFilterType === 'range' && this.fromDate && this.toDate) {
      const from = new Date(this.fromDate);
      const to = new Date(this.toDate);
      return tasks.filter(task => {
        const taskDate = new Date(task.Deadline);
        return taskDate >= from && taskDate <= to;
      });
    }

    return tasks;
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
      default:
        return '';
    }
  }

  getStatusClass(status: TaskItemStatus): string {
    switch (status) {
      case TaskItemStatus.NotStarted:
        return 'not-started';
      case TaskItemStatus.InProgress:
        return 'in-progress';
      case TaskItemStatus.Late:
        return 'late';
      case TaskItemStatus.Completed:
        return 'completed';
      default:
        return 'not-started';
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
      default:
        return 'Unknown';
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
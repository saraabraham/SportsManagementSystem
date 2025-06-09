import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { TaskItem, CreateTaskRequest, SPORTS_OPTIONS } from '../../models/task.model';
import { TaskItemStatus } from '../../enums/task-item-status.enum';

@Component({
  selector: 'app-task-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-management.component.html',
  styleUrls: ['./task-management.component.css']
})
export class TaskManagementComponent implements OnInit {
  protected dashboardService = inject(DashboardService);

  // Signals for component state
  showModal = signal(false);
  editingTask = signal<TaskItem | null>(null);
  statusFilter = '';
  sportFilter = '';
  searchTerm = '';

  // Form data
  formData: any = this.getEmptyFormData();

  // Options
  statusOptions = [
    { value: TaskItemStatus.NotStarted, label: 'Not Started' },
    { value: TaskItemStatus.InProgress, label: 'In Progress' },
    { value: TaskItemStatus.Late, label: 'Late' },
    { value: TaskItemStatus.Completed, label: 'Completed' },
    { value: TaskItemStatus.OnHold, label: 'On Hold' },
    { value: TaskItemStatus.Cancelled, label: 'Cancelled' }
  ];

  sportsOptions = SPORTS_OPTIONS;

  // Enhanced computed properties with debugging
  filteredTasks = computed(() => {
    console.log('=== TASK MANAGEMENT: COMPUTING FILTERED TASKS ===');
    const dashboardData = this.dashboardService.dashboardData();
    console.log('Dashboard data in computed:', dashboardData);

    const tasks = dashboardData?.Tasks || [];
    console.log('Raw tasks from dashboard:', tasks);
    console.log('Number of raw tasks:', tasks.length);
    console.log('Current filters:', {
      statusFilter: this.statusFilter,
      sportFilter: this.sportFilter,
      searchTerm: this.searchTerm
    });

    const filtered = tasks.filter(task => {
      const matchesStatus = !this.statusFilter || task.Status === this.statusFilter;
      const matchesSport = !this.sportFilter || task.SportPlayed === this.sportFilter;
      const matchesSearch = !this.searchTerm ||
        task.Name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.Customer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        task.AssignedTo.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matches = matchesStatus && matchesSport && matchesSearch;

      // Log first few tasks to see what's happening
      if (tasks.indexOf(task) < 3) {
        console.log(`Task "${task.Name}":`, {
          status: task.Status,
          sport: task.SportPlayed,
          matchesStatus,
          matchesSport,
          matchesSearch,
          finalMatch: matches
        });
      }

      return matches;
    });

    console.log('Filtered tasks result:', filtered);
    console.log('Number of filtered tasks:', filtered.length);

    return filtered;
  });

  ngOnInit(): void {
    console.log('=== TASK MANAGEMENT COMPONENT INIT ===');
    console.log('Dashboard service:', this.dashboardService);
    console.log('Initial loading state:', this.dashboardService.loading());
    console.log('Initial error state:', this.dashboardService.error());
    console.log('Initial dashboard data:', this.dashboardService.dashboardData());

    this.loadTasks();
  }

  loadTasks(): void {
    console.log('=== TASK MANAGEMENT: LOADING TASKS ===');
    console.log('Calling getDashboardData...');

    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        console.log('✅ TASK MANAGEMENT: Dashboard data loaded successfully:', data);
        console.log('✅ TASK MANAGEMENT: Full data structure:', JSON.stringify(data, null, 2));
        console.log('✅ TASK MANAGEMENT: Data keys:', Object.keys(data));
        console.log('✅ TASK MANAGEMENT: Tasks property:', data.Tasks);
        console.log('✅ TASK MANAGEMENT: Tasks type:', typeof data.Tasks);
        console.log('✅ TASK MANAGEMENT: Tasks is Array?:', Array.isArray(data.Tasks));
        console.log('✅ TASK MANAGEMENT: Number of tasks:', data.Tasks?.length || 0);

        // Check other properties
        console.log('✅ TASK MANAGEMENT: TaskCompletion:', data.TaskCompletion);
        console.log('✅ TASK MANAGEMENT: ActiveTasks:', data.ActiveTasks);
        console.log('✅ TASK MANAGEMENT: Resources:', data.Resources);

        console.log('✅ TASK MANAGEMENT: Service loading state after load:', this.dashboardService.loading());
        console.log('✅ TASK MANAGEMENT: Service dashboard data after load:', this.dashboardService.dashboardData());
      },
      error: (error) => {
        console.error('❌ TASK MANAGEMENT: Error loading tasks:', error);
        console.error('❌ TASK MANAGEMENT: Error details:', error.error);
        console.error('❌ TASK MANAGEMENT: Error status:', error.status);
      }
    });
  }

  applyFilters(): void {
    console.log('=== APPLYING FILTERS ===');
    console.log('Current filter values:', {
      statusFilter: this.statusFilter,
      sportFilter: this.sportFilter,
      searchTerm: this.searchTerm
    });
    // Filters are applied automatically through computed signal
  }

  clearFilters(): void {
    console.log('=== CLEARING ALL FILTERS ===');
    this.statusFilter = '';
    this.sportFilter = '';
    this.searchTerm = '';
    console.log('Filters cleared, should show all tasks now');
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.formData = this.getEmptyFormData();
    this.showModal.set(true);
  }

  editTask(task: TaskItem): void {
    this.editingTask.set(task);
    this.formData = {
      name: task.Name,
      customer: task.Customer,
      phoneNo: task.PhoneNo,
      sportPlayed: task.SportPlayed,
      assignedTo: task.AssignedTo,
      groupTask: task.GroupTask,
      deadline: this.formatDateForInput(task.Deadline),
      status: task.Status,
      workRequired: task.WorkRequired,
      percentCompleted: task.PercentCompleted,
      updates: task.Updates
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
    this.formData = this.getEmptyFormData();
  }

  saveTask(): void {
    console.log('Raw form data:', this.formData);

    // Convert date to ISO string format for API
    const deadlineDate = new Date(this.formData.deadline);
    if (isNaN(deadlineDate.getTime())) {
      alert('Please enter a valid deadline date');
      return;
    }

    const taskData = {
      name: this.formData.name?.trim(),
      customer: this.formData.customer?.trim(),
      phoneNo: this.formData.phoneNo?.trim() || '',
      sportPlayed: this.formData.sportPlayed?.trim(),
      assignedTo: this.formData.assignedTo?.trim(),
      groupTask: this.formData.groupTask?.trim() || 'General',
      deadline: deadlineDate.toISOString(), // Convert to ISO string
      status: this.formData.status || TaskItemStatus.NotStarted,
      workRequired: Number(this.formData.workRequired) || 1,
      percentCompleted: Number(this.formData.percentCompleted) || 0,
      updates: this.formData.updates?.trim() || ''
    };

    console.log('Processed task data:', taskData);
    console.log('Deadline as ISO string:', taskData.deadline);

    // Validation check
    const errors = [];
    if (!taskData.name) errors.push('Name is required');
    if (!taskData.customer) errors.push('Customer is required');
    if (!taskData.sportPlayed) errors.push('Sport is required');
    if (!taskData.assignedTo) errors.push('Assigned to is required');
    if (!taskData.deadline) errors.push('Valid deadline is required');

    if (errors.length > 0) {
      console.error('Validation errors:', errors);
      alert('Please fix these errors:\n' + errors.join('\n'));
      return;
    }

    if (this.editingTask()) {
      // Update existing task
      console.log('Updating task ID:', this.editingTask()!.Id);
      this.dashboardService.updateTask(this.editingTask()!.Id, taskData as any).subscribe({
        next: (response) => {
          console.log('Task updated successfully:', response);
          this.closeModal();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error updating task:', error);
          console.error('Error details:', error.error);
          alert('Error updating task: ' + (error.error?.message || error.message));
        }
      });
    } else {
      // Create new task
      console.log('Creating new task with data:', taskData);
      this.dashboardService.createTask(taskData as any).subscribe({
        next: (response) => {
          console.log('Task created successfully:', response);
          this.closeModal();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error creating task:', error);
          console.error('Full error object:', error);

          let errorMessage = 'Error creating task: ';
          if (error.error?.message) {
            errorMessage += error.error.message;
          } else if (error.error?.errors) {
            if (Array.isArray(error.error.errors)) {
              errorMessage += error.error.errors.join(', ');
            } else {
              errorMessage += JSON.stringify(error.error.errors);
            }
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Unknown error occurred';
          }
          alert(errorMessage);
        }
      });
    }
  }

  deleteTask(id: number): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.dashboardService.deleteTask(id).subscribe({
        next: () => {
          console.log('Task deleted successfully');
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          alert('Error deleting task. Please try again.');
        }
      });
    }
  }

  getEmptyFormData() {
    return {
      name: '',
      customer: '',
      phoneNo: '',
      sportPlayed: '',
      assignedTo: '',
      groupTask: '',
      deadline: '',
      status: TaskItemStatus.NotStarted,
      workRequired: 1,
      percentCompleted: 0,
      updates: ''
    };
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: '2-digit'
    };
    return d.toLocaleDateString('en-US', options);
  }

  formatDateForInput(date: Date | string): string {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  getTaskRowClass(task: TaskItem): string {
    switch (task.Status) {
      case TaskItemStatus.Late as unknown as TaskItemStatus:
        return 'late';
      case TaskItemStatus.Completed as unknown as TaskItemStatus:
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
      case TaskItemStatus.OnHold:
        return 'on-hold';
      case TaskItemStatus.Cancelled:
        return 'cancelled';
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
      case TaskItemStatus.OnHold:
        return 'On Hold';
      case TaskItemStatus.Cancelled:
        return 'Cancelled';
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

  getDeadlineClass(deadline: Date | string): string {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'deadline-overdue';
    } else if (diffDays <= 3) {
      return 'deadline-upcoming';
    }
    return 'deadline-normal';
  }

  getUpdatesPreview(updates: string): string {
    if (!updates) return 'No updates';
    return updates.length > 50 ? updates.substring(0, 50) + '...' : updates;
  }
}
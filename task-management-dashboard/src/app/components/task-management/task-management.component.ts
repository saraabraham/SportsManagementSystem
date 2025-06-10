// src/app/components/task-management/task-management.component.ts
// Updated with enhanced customer filtering for fixtures integration

import { Component, OnInit, inject, signal, computed, Input } from '@angular/core';
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
  @Input() highlightedTaskId: number | null = null;

  // Signals for component state
  public showModal = signal(false);
  public editingTask = signal<TaskItem | null>(null);

  // Enhanced filter signals including customer filter
  public statusFilter = signal('');
  public sportFilter = signal('');
  public searchTerm = signal('');
  public customerFilter = signal(''); // Customer filter for fixtures integration

  // Form data
  public formData: any = signal(this.getEmptyFormData());

  // Options
  public statusOptions = [
    { value: TaskItemStatus.NotStarted, label: 'Not Started' },
    { value: TaskItemStatus.InProgress, label: 'In Progress' },
    { value: TaskItemStatus.Late, label: 'Late' },
    { value: TaskItemStatus.Completed, label: 'Completed' },
    { value: TaskItemStatus.OnHold, label: 'On Hold' },
    { value: TaskItemStatus.Cancelled, label: 'Cancelled' }
  ];

  public sportsOptions = SPORTS_OPTIONS;

  // Expose enum to template
  protected readonly TaskItemStatus = TaskItemStatus;

  // Enhanced computed properties with customer filtering
  filteredTasks = computed(() => {
    console.log('=== TASK MANAGEMENT: COMPUTING FILTERED TASKS ===');
    const dashboardData = this.dashboardService.dashboardData();
    const tasks = dashboardData?.Tasks || [];

    // Get all current filter values including customer filter
    const currentStatusFilter = this.statusFilter();
    const currentSportFilter = this.sportFilter();
    const currentSearchTerm = this.searchTerm();
    const currentCustomerFilter = this.customerFilter(); // Customer filter

    console.log('Current filters:', {
      statusFilter: currentStatusFilter,
      sportFilter: currentSportFilter,
      searchTerm: currentSearchTerm,
      customerFilter: currentCustomerFilter // Log customer filter
    });

    const filtered = tasks.filter(task => {
      const matchesStatus = !currentStatusFilter || task.Status === currentStatusFilter;
      const matchesSport = !currentSportFilter || task.SportPlayed === currentSportFilter;
      const matchesSearch = !currentSearchTerm ||
        task.Name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        task.Customer.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        task.AssignedTo.toLowerCase().includes(currentSearchTerm.toLowerCase());

      // Filter by customer name (exact match for fixtures integration)
      const matchesCustomer = !currentCustomerFilter ||
        task.Customer.toLowerCase() === currentCustomerFilter.toLowerCase();

      return matchesStatus && matchesSport && matchesSearch && matchesCustomer;
    });

    console.log('Filtered tasks result:', filtered.length);
    return filtered;
  });

  ngOnInit(): void {
    console.log('=== TASK MANAGEMENT COMPONENT INIT ===');
    this.loadTasks();
  }

  loadTasks(): void {
    console.log('=== TASK MANAGEMENT: LOADING TASKS ===');
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        console.log('✅ TASK MANAGEMENT: Dashboard data loaded successfully:', data);
      },
      error: (error) => {
        console.error('❌ TASK MANAGEMENT: Error loading tasks:', error);
      }
    });
  }

  // Enhanced filter methods
  applyFilters(): void {
    console.log('=== APPLYING FILTERS ===');
    console.log('Current filter values:', {
      statusFilter: this.statusFilter(),
      sportFilter: this.sportFilter(),
      searchTerm: this.searchTerm(),
      customerFilter: this.customerFilter()
    });
  }

  clearFilters(): void {
    console.log('=== CLEARING ALL FILTERS ===');
    this.statusFilter.set('');
    this.sportFilter.set('');
    this.searchTerm.set('');
    this.customerFilter.set(''); // Clear customer filter
    console.log('Filters cleared, should show all tasks now');
  }

  // NEW: Method to apply customer filter from external navigation (fixtures)
  applyCustomerFilter(customerName: string): void {
    console.log('=== APPLYING CUSTOMER FILTER FROM FIXTURES ===', customerName);
    this.customerFilter.set(customerName);
    // Clear other filters to focus on the customer
    this.statusFilter.set('');
    this.sportFilter.set('');
    this.searchTerm.set('');
    console.log('Customer filter applied, showing tasks for:', customerName);
  }

  // Method to clear only customer filter
  clearCustomerFilter(): void {
    console.log('=== CLEARING CUSTOMER FILTER ===');
    this.customerFilter.set('');
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.formData.set(this.getEmptyFormData());
    this.showModal.set(true);
  }

  editTask(task: TaskItem): void {
    this.editingTask.set(task);
    this.formData.set({
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
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingTask.set(null);
    this.formData.set(this.getEmptyFormData());
  }

  saveTask(): void {
    const currentFormData = this.formData();
    console.log('Raw form data:', currentFormData);

    const deadlineDate = new Date(currentFormData.deadline);
    if (isNaN(deadlineDate.getTime())) {
      alert('Please enter a valid deadline date');
      return;
    }

    const taskData: CreateTaskRequest = {
      name: currentFormData.name?.trim(),
      customer: currentFormData.customer?.trim(),
      phoneNo: currentFormData.phoneNo?.trim() || '',
      sportPlayed: currentFormData.sportPlayed?.trim(),
      assignedTo: currentFormData.assignedTo?.trim(),
      groupTask: currentFormData.groupTask?.trim() || 'General',
      deadline: deadlineDate.toISOString(),
      status: currentFormData.status || TaskItemStatus.NotStarted,
      workRequired: Number(currentFormData.workRequired) || 1,
      percentCompleted: Number(currentFormData.percentCompleted) || 0,
      updates: currentFormData.updates?.trim() || ''
    };

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
      const taskId = this.editingTask()!.Id;
      console.log('Updating task ID:', taskId);
      this.dashboardService.updateTask(taskId, taskData).subscribe({
        next: (response) => {
          console.log('Task updated successfully:', response);
          this.closeModal();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error updating task:', error);
          alert('Error updating task: ' + (error.error?.message || error.message));
        }
      });
    } else {
      console.log('Creating new task with data:', taskData);
      this.dashboardService.createTask(taskData).subscribe({
        next: (response) => {
          console.log('Task created successfully:', response);
          this.closeModal();
          this.loadTasks();
        },
        error: (error) => {
          console.error('Error creating task:', error);
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
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const defaultDeadline = `${year}-${month}-${day}`;

    return {
      name: '',
      customer: '',
      phoneNo: '',
      sportPlayed: '',
      assignedTo: '',
      groupTask: '',
      deadline: defaultDeadline,
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
    if (isNaN(d.getTime())) {
      console.warn("Attempted to format an invalid date for input:", date);
      return '';
    }
    return d.toISOString().split('T')[0];
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
    now.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'deadline-overdue';
    } else if (diffDays <= 3) {
      return 'deadline-upcoming';
    }
    return 'deadline-normal';
  }

  getUpdatesPreview(updates: string | undefined): string {
    if (!updates) return 'No updates';
    return updates.length > 50 ? updates.substring(0, 50) + '...' : updates;
  }
}
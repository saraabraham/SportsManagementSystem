import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
// Ensure TaskItem, CreateTaskRequest, SPORTS_OPTIONS are correctly defined in your task.model.ts
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
  public showModal = signal(false); // Make public
  public editingTask = signal<TaskItem | null>(null); // Make public, correct type

  // 🚨 THE FIX: Convert these to signals
  public statusFilter = signal('');
  public sportFilter = signal('');
  public searchTerm = signal('');

  // Form data (already a signal, good!)
  public formData: any = signal(this.getEmptyFormData()); // Make public

  // Options (already public, good!)
  public statusOptions = [
    { value: TaskItemStatus.NotStarted, label: 'Not Started' },
    { value: TaskItemStatus.InProgress, label: 'In Progress' },
    { value: TaskItemStatus.Late, label: 'Late' },
    { value: TaskItemStatus.Completed, label: 'Completed' },
    { value: TaskItemStatus.OnHold, label: 'On Hold' },
    { value: TaskItemStatus.Cancelled, label: 'Cancelled' }
  ];

  public sportsOptions = SPORTS_OPTIONS; // Assuming SPORTS_OPTIONS is a string[]

  // Expose enum to template
  protected readonly TaskItemStatus = TaskItemStatus;

  // Enhanced computed properties with debugging
  filteredTasks = computed(() => {
    console.log('=== TASK MANAGEMENT: COMPUTING FILTERED TASKS ===');
    const dashboardData = this.dashboardService.dashboardData();
    console.log('Dashboard data in computed:', dashboardData);

    const tasks = dashboardData?.Tasks || [];
    console.log('Raw tasks from dashboard:', tasks);
    console.log('Number of raw tasks:', tasks.length);

    // 🚨 IMPORTANT: Access signal values using .()
    const currentStatusFilter = this.statusFilter();
    const currentSportFilter = this.sportFilter();
    const currentSearchTerm = this.searchTerm();

    console.log('Current filters (from signals):', {
      statusFilter: currentStatusFilter,
      sportFilter: currentSportFilter,
      searchTerm: currentSearchTerm
    });

    const filtered = tasks.filter(task => {
      // 🚨 IMPORTANT: Use the signal values directly
      const matchesStatus = !currentStatusFilter || task.Status === currentStatusFilter;
      const matchesSport = !currentSportFilter || task.SportPlayed === currentSportFilter;
      const matchesSearch = !currentSearchTerm ||
        task.Name.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        task.Customer.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
        task.AssignedTo.toLowerCase().includes(currentSearchTerm.toLowerCase());

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

  // No changes needed here, ngModel with signals handles it automatically
  applyFilters(): void {
    console.log('=== APPLYING FILTERS ===');
    // 🚨 IMPORTANT: Access signal values for logging
    console.log('Current filter values:', {
      statusFilter: this.statusFilter(),
      sportFilter: this.sportFilter(),
      searchTerm: this.searchTerm()
    });
    // Filters are applied automatically through computed signal due to signal updates via ngModel
  }

  clearFilters(): void {
    console.log('=== CLEARING ALL FILTERS ===');
    // 🚨 IMPORTANT: Use .set() to update signals
    this.statusFilter.set('');
    this.sportFilter.set('');
    this.searchTerm.set('');
    console.log('Filters cleared, should show all tasks now');
  }

  openCreateModal(): void {
    this.editingTask.set(null);
    this.formData.set(this.getEmptyFormData()); // 🚨 IMPORTANT: Use .set() for formData signal
    this.showModal.set(true);
  }

  editTask(task: TaskItem): void {
    this.editingTask.set(task);
    // 🚨 IMPORTANT: Use .set() for formData signal
    this.formData.set({
      name: task.Name,
      customer: task.Customer,
      phoneNo: task.PhoneNo,
      sportPlayed: task.SportPlayed,
      assignedTo: task.AssignedTo,
      groupTask: task.GroupTask,
      deadline: this.formatDateForInput(task.Deadline), // Ensure this returns 'YYYY-MM-DD'
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
    this.formData.set(this.getEmptyFormData()); // 🚨 IMPORTANT: Use .set() for formData signal
  }

  saveTask(): void {
    const currentFormData = this.formData(); // Get current value from signal
    console.log('Raw form data:', currentFormData);

    // Convert date to ISO string format for API
    const deadlineDate = new Date(currentFormData.deadline);
    if (isNaN(deadlineDate.getTime())) {
      alert('Please enter a valid deadline date');
      return;
    }

    const taskData: CreateTaskRequest = { // Use your CreateTaskRequest type here
      name: currentFormData.name?.trim(),
      customer: currentFormData.customer?.trim(),
      phoneNo: currentFormData.phoneNo?.trim() || '',
      sportPlayed: currentFormData.sportPlayed?.trim(),
      assignedTo: currentFormData.assignedTo?.trim(),
      groupTask: currentFormData.groupTask?.trim() || 'General',
      deadline: deadlineDate.toISOString(), // Convert to ISO string
      status: currentFormData.status || TaskItemStatus.NotStarted,
      workRequired: Number(currentFormData.workRequired) || 1,
      percentCompleted: Number(currentFormData.percentCompleted) || 0,
      updates: currentFormData.updates?.trim() || ''
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
      const taskId = this.editingTask()!.Id; // Get the ID from the editingTask signal
      console.log('Updating task ID:', taskId);
      this.dashboardService.updateTask(taskId, taskData).subscribe({ // Pass taskId and data
        next: (response) => {
          console.log('Task updated successfully:', response);
          this.closeModal();
          this.loadTasks(); // Reload to ensure UI is consistent
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
      this.dashboardService.createTask(taskData).subscribe({
        next: (response) => {
          console.log('Task created successfully:', response);
          this.closeModal();
          this.loadTasks(); // Reload to ensure UI is consistent
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
          this.loadTasks(); // Reload tasks to update the list
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
    // Ensure d is a valid date object before calling toISOString
    if (isNaN(d.getTime())) {
      return ''; // Return empty string for invalid dates
    }
    return d.toISOString().split('T')[0];
  }

  getTaskRowClass(task: TaskItem): string {
    // 🚨 Type assertion removed as it's often a sign of type mismatch.
    // Ensure task.Status is actually of type TaskItemStatus.
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
    // Set 'now' to start of day for comparison to ignore time
    now.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(deadline);
    // Set 'deadlineDate' to start of day for comparison
    deadlineDate.setHours(0, 0, 0, 0);

    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)); // Use Math.ceil to treat same-day as 0 days, next day as 1

    if (diffDays < 0) { // Deadline is in the past
      return 'deadline-overdue';
    } else if (diffDays <= 3) { // Deadline is today or within the next 3 days
      return 'deadline-upcoming';
    }
    return 'deadline-normal';
  }

  getUpdatesPreview(updates: string | undefined): string { // Allow updates to be undefined
    if (!updates) return 'No updates';
    return updates.length > 50 ? updates.substring(0, 50) + '...' : updates;
  }
}
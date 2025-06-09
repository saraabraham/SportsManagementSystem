// src/app/components/task-management/task-management.component.ts - Fixed version
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { TaskItem, TaskStatus, CreateTaskRequest, SPORTS_OPTIONS } from '../../models/task.model';

@Component({
    selector: 'app-task-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="task-management-container">
      <div class="header-section">
        <h2>Task Management</h2>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <i class="fas fa-plus"></i> Add New Task
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <label>Filter by Status:</label>
          <select [(ngModel)]="statusFilter" (change)="applyFilters()">
            <option value="">All Statuses</option>
            @for (status of statusOptions; track status.value) {
              <option [value]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>
        
        <div class="filter-group">
          <label>Filter by Sport:</label>
          <select [(ngModel)]="sportFilter" (change)="applyFilters()">
            <option value="">All Sports</option>
            @for (sport of sportsOptions; track sport) {
              <option [value]="sport">{{ sport }}</option>
            }
          </select>
        </div>
        
        <div class="filter-group">
          <label>Search:</label>
          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilters()" 
                 placeholder="Search by customer, assignee, or task name...">
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="table-container">
        @if (dashboardService.loading()) {
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading tasks...</p>
          </div>
        } @else if (dashboardService.error()) {
          <div class="error-message">
            <h3>Error loading tasks</h3>
            <p>{{ dashboardService.error() }}</p>
            <button class="btn btn-primary" (click)="loadTasks()">Retry</button>
          </div>
        } @else {
          <table class="tasks-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Customer</th>
                <th>Phone No</th>
                <th>Sport</th>
                <th>Assigned To</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Updates</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (task of filteredTasks(); track task.id) {
                <tr [class]="getTaskRowClass(task)">
                  <td>
                    <strong>{{ task.name }}</strong>
                    <small class="group-tag">{{ task.groupTask }}</small>
                  </td>
                  <td>{{ task.customer }}</td>
                  <td>
                    <a [href]="'tel:' + task.phoneNo">{{ task.phoneNo }}</a>
                  </td>
                  <td>
                    <span class="sport-badge">{{ task.sportPlayed }}</span>
                  </td>
                  <td>{{ task.assignedTo }}</td>
                  <td>
                    <span [class]="getDeadlineClass(task.deadline)">
                      {{ formatDate(task.deadline) }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </span>
                  </td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="task.percentCompleted"></div>
                      </div>
                      <span class="progress-text">{{ task.percentCompleted }}%</span>
                    </div>
                  </td>
                  <td class="updates-cell">
                    <div class="updates-preview" [title]="task.updates">
                      {{ getUpdatesPreview(task.updates) }}
                    </div>
                  </td>
                  <td class="actions-cell">
                    <button class="btn-icon" (click)="editTask(task)" title="Edit">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" (click)="deleteTask(task.id)" title="Delete">
                      <i class="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingTask() ? 'Edit Task' : 'Create New Task' }}</h3>
              <button class="close-btn" (click)="closeModal()">×</button>
            </div>
            
            <form class="modal-body" (ngSubmit)="saveTask()" #formRef="ngForm">
              <div class="form-grid">
                <div class="form-group">
                  <label for="taskName">Task Name *</label>
                  <input type="text" id="taskName" [(ngModel)]="formData.name" name="taskName" required>
                </div>
                
                <div class="form-group">
                  <label for="customerName">Customer *</label>
                  <input type="text" id="customerName" [(ngModel)]="formData.customer" name="customerName" required>
                </div>
                
                <div class="form-group">
                  <label for="phoneNumber">Phone Number</label>
                  <input type="tel" id="phoneNumber" [(ngModel)]="formData.phoneNo" name="phoneNumber">
                </div>
                
                <div class="form-group">
                  <label for="sport">Sport *</label>
                  <select id="sport" [(ngModel)]="formData.sportPlayed" name="sport" required>
                    <option value="">Select Sport</option>
                    @for (sport of sportsOptions; track sport) {
                      <option [value]="sport">{{ sport }}</option>
                    }
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="assignee">Assigned To *</label>
                  <input type="text" id="assignee" [(ngModel)]="formData.assignedTo" name="assignee" required>
                </div>
                
                <div class="form-group">
                  <label for="group">Group/Category</label>
                  <input type="text" id="group" [(ngModel)]="formData.groupTask" name="group">
                </div>
                
                <div class="form-group">
                  <label for="dueDate">Deadline *</label>
                  <input type="date" id="dueDate" [(ngModel)]="formData.deadline" name="dueDate" required>
                </div>
                
                <div class="form-group">
                  <label for="taskStatus">Status</label>
                  <select id="taskStatus" [(ngModel)]="formData.status" name="taskStatus">
                    @for (status of statusOptions; track status.value) {
                      <option [value]="status.value">{{ status.label }}</option>
                    }
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="hoursRequired">Work Required (hours)</label>
                  <input type="number" id="hoursRequired" [(ngModel)]="formData.workRequired" name="hoursRequired" min="1">
                </div>
                
                <div class="form-group">
                  <label for="completionPercent">Progress (%)</label>
                  <input type="number" id="completionPercent" [(ngModel)]="formData.percentCompleted" 
                         name="completionPercent" min="0" max="100">
                </div>
              </div>
              
              <div class="form-group full-width">
                <label for="taskUpdates">Updates/Notes</label>
                <textarea id="taskUpdates" [(ngModel)]="formData.updates" name="taskUpdates" 
                         rows="3" placeholder="Add any updates or notes about this task..."></textarea>
              </div>
              
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!formRef.valid">
                  {{ editingTask() ? 'Update Task' : 'Create Task' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .task-management-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header-section h2 {
      margin: 0;
      color: #2c3e50;
      font-size: 2rem;
    }

    .filters-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 600;
      color: #2c3e50;
    }

    .filter-group select,
    .filter-group input {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .table-container {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .tasks-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1200px;
    }

    .tasks-table th {
      background: #34495e;
      color: white;
      padding: 15px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 0.9rem;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tasks-table td {
      padding: 12px 10px;
      border-bottom: 1px solid #e9ecef;
      font-size: 0.85rem;
      vertical-align: top;
    }

    .tasks-table tr:hover {
      background: #f8f9fa;
    }

    .tasks-table tr.late {
      background: rgba(231, 76, 60, 0.1);
    }

    .tasks-table tr.completed {
      background: rgba(46, 204, 113, 0.1);
    }

    .group-tag {
      display: block;
      color: #6c757d;
      font-size: 0.75rem;
      margin-top: 2px;
    }

    .sport-badge {
      background: #3498db;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.not-started { background: #95a5a6; color: white; }
    .status-badge.in-progress { background: #3498db; color: white; }
    .status-badge.late { background: #e74c3c; color: white; }
    .status-badge.completed { background: #2ecc71; color: white; }
    .status-badge.on-hold { background: #f39c12; color: white; }
    .status-badge.cancelled { background: #7f8c8d; color: white; }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      width: 60px;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(to right, #3498db, #2ecc71);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 35px;
    }

    .updates-cell {
      max-width: 200px;
    }

    .updates-preview {
      max-height: 40px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 0.8rem;
      line-height: 1.3;
      cursor: pointer;
    }

    .actions-cell {
      text-align: center;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 6px 8px;
      margin: 0 2px;
      border-radius: 4px;
      cursor: pointer;
      color: #6c757d;
      transition: all 0.2s ease;
    }

    .btn-icon:hover {
      background: #f8f9fa;
      color: #2c3e50;
    }

    .btn-icon.delete:hover {
      background: #e74c3c;
      color: white;
    }

    .deadline-upcoming {
      color: #f39c12;
      font-weight: 600;
    }

    .deadline-overdue {
      color: #e74c3c;
      font-weight: 600;
    }

    .deadline-normal {
      color: #2c3e50;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 10px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6c757d;
      cursor: pointer;
      padding: 5px;
    }

    .modal-body {
      padding: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      margin-bottom: 5px;
      font-weight: 600;
      color: #2c3e50;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 10px 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: border-color 0.2s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn-secondary:hover {
      background: #7f8c8d;
    }

    .btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
    }

    .loading-spinner,
    .error-message {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(52, 152, 219, 0.3);
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        gap: 15px;
        align-items: stretch;
      }

      .filters-section {
        grid-template-columns: 1fr;
      }

      .tasks-table th,
      .tasks-table td {
        padding: 8px 6px;
        font-size: 0.8rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TaskManagementComponent implements OnInit {
    protected dashboardService = inject(DashboardService);

    // Signals for component state
    showModal = signal(false);
    editingTask = signal<TaskItem | null>(null);
    statusFilter = '';
    sportFilter = '';
    searchTerm = '';

    // Form data - renamed to avoid conflicts
    formData: any = this.getEmptyFormData();

    // Options
    statusOptions = [
        { value: TaskStatus.NotStarted, label: 'Not Started' },
        { value: TaskStatus.InProgress, label: 'In Progress' },
        { value: TaskStatus.Late, label: 'Late' },
        { value: TaskStatus.Completed, label: 'Completed' },
        { value: TaskStatus.OnHold, label: 'On Hold' },
        { value: TaskStatus.Cancelled, label: 'Cancelled' }
    ];

    sportsOptions = SPORTS_OPTIONS;

    // Computed properties
    filteredTasks = computed(() => {
        const tasks = this.dashboardService.dashboardData()?.tasks || [];

        return tasks.filter(task => {
            const matchesStatus = !this.statusFilter || task.status === this.statusFilter;
            const matchesSport = !this.sportFilter || task.sportPlayed === this.sportFilter;
            const matchesSearch = !this.searchTerm ||
                task.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                task.customer.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                task.assignedTo.toLowerCase().includes(this.searchTerm.toLowerCase());

            return matchesStatus && matchesSport && matchesSearch;
        });
    });

    ngOnInit(): void {
        this.loadTasks();
    }

    loadTasks(): void {
        this.dashboardService.getDashboardData().subscribe({
            error: (error) => {
                console.error('Error loading tasks:', error);
            }
        });
    }

    applyFilters(): void {
        // Filters are applied automatically through computed signal
    }

    openCreateModal(): void {
        this.editingTask.set(null);
        this.formData = this.getEmptyFormData();
        this.showModal.set(true);
    }

    editTask(task: TaskItem): void {
        this.editingTask.set(task);
        this.formData = {
            name: task.name,
            customer: task.customer,
            phoneNo: task.phoneNo,
            sportPlayed: task.sportPlayed,
            assignedTo: task.assignedTo,
            groupTask: task.groupTask,
            deadline: this.formatDateForInput(task.deadline),
            status: task.status,
            workRequired: task.workRequired,
            percentCompleted: task.percentCompleted,
            updates: task.updates
        };
        this.showModal.set(true);
    }

    closeModal(): void {
        this.showModal.set(false);
        this.editingTask.set(null);
        this.formData = this.getEmptyFormData();
    }

    saveTask(): void {
        const taskData: CreateTaskRequest = {
            name: this.formData.name,
            customer: this.formData.customer,
            phoneNo: this.formData.phoneNo,
            sportPlayed: this.formData.sportPlayed,
            assignedTo: this.formData.assignedTo,
            groupTask: this.formData.groupTask || 'General',
            deadline: new Date(this.formData.deadline),
            status: this.formData.status,
            workRequired: this.formData.workRequired || 1,
            percentCompleted: this.formData.percentCompleted || 0,
            updates: this.formData.updates || ''
        };

        if (this.editingTask()) {
            // Update existing task
            this.dashboardService.updateTask(this.editingTask()!.id, taskData as any).subscribe({
                next: () => {
                    this.closeModal();
                    this.loadTasks();
                },
                error: (error) => {
                    console.error('Error updating task:', error);
                }
            });
        } else {
            // Create new task
            this.dashboardService.createTask(taskData as any).subscribe({
                next: () => {
                    this.closeModal();
                    this.loadTasks();
                },
                error: (error) => {
                    console.error('Error creating task:', error);
                }
            });
        }
    }

    deleteTask(id: number): void {
        if (confirm('Are you sure you want to delete this task?')) {
            this.dashboardService.deleteTask(id).subscribe({
                next: () => {
                    this.loadTasks();
                },
                error: (error) => {
                    console.error('Error deleting task:', error);
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
            status: TaskStatus.NotStarted,
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
        switch (task.status) {
            case TaskStatus.Late:
                return 'late';
            case TaskStatus.Completed:
                return 'completed';
            default:
                return '';
        }
    }

    getStatusClass(status: TaskStatus): string {
        switch (status) {
            case TaskStatus.NotStarted:
                return 'not-started';
            case TaskStatus.InProgress:
                return 'in-progress';
            case TaskStatus.Late:
                return 'late';
            case TaskStatus.Completed:
                return 'completed';
            case TaskStatus.OnHold:
                return 'on-hold';
            case TaskStatus.Cancelled:
                return 'cancelled';
            default:
                return 'not-started';
        }
    }

    getStatusText(status: TaskStatus): string {
        switch (status) {
            case TaskStatus.NotStarted:
                return 'Not Started';
            case TaskStatus.InProgress:
                return 'In Progress';
            case TaskStatus.Late:
                return 'Late';
            case TaskStatus.Completed:
                return 'Completed';
            case TaskStatus.OnHold:
                return 'On Hold';
            case TaskStatus.Cancelled:
                return 'Cancelled';
            default:
                return 'Unknown';
        }
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
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardData, TaskItem, TaskStatus, TaskGroup } from '../../models/task.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="dashboard-container">
      @if (dashboardService.loading()) {
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      } @else if (dashboardService.error()) {
        <div class="error-message">
          <h3>Error loading dashboard</h3>
          <p>{{ dashboardService.error() }}</p>
          <button class="btn btn-primary" (click)="retryLoad()">Retry</button>
        </div>
      } @else {
        <div class="dashboard-grid">
          <!-- Left Side - Charts and Metrics -->
          <div class="charts-section">
            <div class="chart-row">
              <div class="chart-card resource-workload">
                <h3>Resource Workload</h3>
                <div class="chart-container">
                  <div class="bar-chart">
                    <div class="bar done" [style.height.%]="getResourceWorkloadPercentage('done')">
                      <span class="bar-label">{{ (dashboardData()?.resourceWorkload?.done) || 0 }}</span>
                    </div>
                    <div class="bar todo" [style.height.%]="getResourceWorkloadPercentage('todo')">
                      <span class="bar-label">{{ (dashboardData()?.resourceWorkload?.leftToDo) || 0 }}</span>
                    </div>
                  </div>
                  <div class="resource-icons">
                    @for (resource of dashboardData()?.resources; track resource.id) {
                      <div class="icon-group">
                        <i class="fas fa-user" 
                           [class.busy]="resource.status === 'Busy'" 
                           [class.overloaded]="resource.status === 'Overloaded'"></i>
                      </div>
                    }
                  </div>
                  <div class="legend">
                    <span class="legend-item done">Done</span>
                    <span class="legend-item todo">Left to do</span>
                  </div>
                </div>
              </div>

              <div class="chart-card task-completion">
                <h3>Task completion</h3>
                <div class="donut-chart">
                  <div class="donut-container">
                    <svg width="120" height="120" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                              stroke="#ff6b6b" stroke-width="3" 
                              [attr.stroke-dasharray]="getTaskCompletionDashArray('late')" 
                              stroke-dashoffset="25"></circle>
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                              stroke="#4ecdc4" stroke-width="3" 
                              [attr.stroke-dasharray]="getTaskCompletionDashArray('onTrack')" 
                              stroke-dashoffset="0"></circle>
                    </svg>
                    <div class="donut-center">
                      <span class="total">{{ dashboardService.totalTasks() }}</span>
                    </div>
                  </div>
                  <div class="chart-labels">
                    <div class="label-item">
                      <span class="dot on-track"></span>
                      <span>On track: {{ (dashboardData()?.taskCompletion?.onTrack) || 0 }}</span>
                    </div>
                    <div class="label-item">
                      <span class="dot late"></span>
                      <span>Late: {{ (dashboardData()?.taskCompletion?.late) || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="chart-card active-tasks">
                <h3>Active Task status</h3>
                <div class="donut-chart">
                  <div class="donut-container">
                    <svg width="120" height="120" viewBox="0 0 42 42">
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                              stroke="#95a5a6" stroke-width="3" 
                              [attr.stroke-dasharray]="getActiveTasksDashArray('notStarted')" 
                              stroke-dashoffset="75"></circle>
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                              stroke="#3498db" stroke-width="3" 
                              [attr.stroke-dasharray]="getActiveTasksDashArray('inProgress')" 
                              stroke-dashoffset="50"></circle>
                      <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                              stroke="#2ecc71" stroke-width="3" 
                              [attr.stroke-dasharray]="getActiveTasksDashArray('completed')" 
                              stroke-dashoffset="0"></circle>
                    </svg>
                  </div>
                  <div class="chart-labels">
                    <div class="label-item">
                      <span class="dot completed"></span>
                      <span>Completed: {{ (dashboardData()?.activeTasks?.completed) || 0 }}</span>
                    </div>
                    <div class="label-item">
                      <span class="dot in-progress"></span>
                      <span>In progress: {{ (dashboardData()?.activeTasks?.inProgress) || 0 }}</span>
                    </div>
                    <div class="label-item">
                      <span class="dot not-started"></span>
                      <span>Not Started: {{ (dashboardData()?.activeTasks?.notStarted) || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="project-completion-card">
              <h3>Today</h3>
              <p class="date">{{ getCurrentDate() }}</p>
              <div class="alert-section">
                <div class="alert red-flag">
                  <span class="label">Red Flag days</span>
                  <span class="value">5 days</span>
                </div>
                <div class="alert red-flag-date">
                  <span class="label">Red Flag date</span>
                  <span class="value">Sat 28 Nov</span>
                </div>
                <div class="alert deadline">
                  <span class="label">Deadline</span>
                  <span class="value">Wed 21 Dec</span>
                </div>
              </div>
              <div class="project-completion">
                <h4>Project Completion</h4>
                <div class="completion-chart">
                  <svg width="80" height="80" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                            stroke="#ecf0f1" stroke-width="3"></circle>
                    <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" 
                            stroke="#2ecc71" stroke-width="3" 
                            [attr.stroke-dasharray]="((dashboardData()?.projectCompletion?.completionPercentage) || 0) + ' 100'" 
                            stroke-dashoffset="25"></circle>
                  </svg>
                  <div class="completion-percentage">
                    {{ (dashboardData()?.projectCompletion?.completionPercentage) || 0 }}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Side - Task Tables -->
          <div class="tables-section">
            @for (group of dashboardService.taskGroups(); track group.name) {
              <div class="task-group">
                <h4 class="group-title">{{ group.name }}</h4>
                <table class="task-table">
                  <thead>
                    <tr>
                      <th>Who's on it?</th>
                      <th>Work required</th>
                      <th>Deadline</th>
                      <th>% completed</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (task of group.tasks; track task.id) {
                      <tr [class]="getTaskRowClass(task)">
                        <td>{{ task.assignedTo }}</td>
                        <td>{{ task.workRequired }}</td>
                        <td>{{ formatDate(task.deadline) }}</td>
                        <td>
                          <div class="progress-container">
                            <div class="progress-bar">
                              <div class="progress-fill" [style.width.%]="task.percentCompleted"></div>
                            </div>
                            <span class="progress-text">{{ task.percentCompleted }}%</span>
                          </div>
                        </td>
                        <td>
                          <span class="status-badge" [class]="getStatusClass(task.status)">
                            {{ getStatusText(task.status) }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .dashboard-container {
      max-width: 1400px;
      margin: 0 auto;
      background: #2c3e50;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: white;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      text-align: center;
      color: white;
      padding: 40px;
    }

    .error-message h3 {
      color: #e74c3c;
      margin-bottom: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 20px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 30px;
      min-height: 600px;
    }

    .charts-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .chart-row {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .chart-card {
      background: #34495e;
      border-radius: 10px;
      padding: 20px;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .chart-card h3 {
      margin: 0 0 15px 0;
      font-size: 1.1rem;
      font-weight: 600;
      text-align: center;
      color: #ecf0f1;
    }

    .resource-workload .chart-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    .bar-chart {
      display: flex;
      gap: 10px;
      height: 80px;
      align-items: flex-end;
    }

    .bar {
      width: 30px;
      background: linear-gradient(to top, #e74c3c, #c0392b);
      border-radius: 4px 4px 0 0;
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      min-height: 20px;
    }

    .bar.done {
      background: linear-gradient(to top, #27ae60, #229954);
    }

    .bar.todo {
      background: linear-gradient(to top, #e74c3c, #c0392b);
    }

    .bar-label {
      position: absolute;
      bottom: 5px;
      font-size: 0.8rem;
      font-weight: bold;
      color: white;
    }

    .resource-icons {
      display: flex;
      gap: 5px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .icon-group i {
      font-size: 1.2rem;
      color: #95a5a6;
    }

    .icon-group i.busy {
      color: #f39c12;
    }

    .icon-group i.overloaded {
      color: #e74c3c;
    }

    .legend {
      display: flex;
      gap: 15px;
      font-size: 0.8rem;
    }

    .legend-item.done::before {
      content: '■';
      color: #27ae60;
      margin-right: 5px;
    }

    .legend-item.todo::before {
      content: '■';
      color: #e74c3c;
      margin-right: 5px;
    }

    .donut-chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
    }

    .donut-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .donut-center {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: bold;
      color: white;
    }

    .chart-labels {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 0.8rem;
    }

    .label-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot.on-track { background: #4ecdc4; }
    .dot.late { background: #ff6b6b; }
    .dot.completed { background: #2ecc71; }
    .dot.in-progress { background: #3498db; }
    .dot.not-started { background: #95a5a6; }

    .project-completion-card {
      background: #34495e;
      border-radius: 10px;
      padding: 20px;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .project-completion-card h3 {
      margin: 0 0 5px 0;
      font-size: 1.1rem;
    }

    .date {
      margin: 0 0 20px 0;
      color: #bdc3c7;
      font-size: 0.9rem;
    }

    .alert-section {
      margin: 20px 0;
    }

    .alert {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      padding: 8px;
      border-radius: 5px;
      font-size: 0.8rem;
    }

    .alert.red-flag {
      background: rgba(231, 76, 60, 0.2);
      border-left: 3px solid #e74c3c;
    }

    .alert.red-flag-date {
      background: rgba(231, 76, 60, 0.2);
      border-left: 3px solid #e74c3c;
    }

    .alert.deadline {
      background: rgba(52, 152, 219, 0.2);
      border-left: 3px solid #3498db;
    }

    .project-completion h4 {
      margin: 20px 0 10px 0;
      font-size: 1rem;
    }

    .completion-chart {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .completion-percentage {
      position: absolute;
      font-size: 1rem;
      font-weight: bold;
      color: white;
    }

    .tables-section {
      background: #ecf0f1;
      border-radius: 10px;
      padding: 20px;
      overflow-y: auto;
      max-height: 600px;
    }

    .task-group {
      margin-bottom: 30px;
    }

    .group-title {
      background: #3498db;
      color: white;
      padding: 10px 15px;
      margin: 0 0 10px 0;
      border-radius: 5px;
      font-size: 1rem;
      font-weight: 600;
    }

    .task-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .task-table th {
      background: #34495e;
      color: white;
      padding: 12px 8px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .task-table td {
      padding: 10px 8px;
      border-bottom: 1px solid #ecf0f1;
      font-size: 0.8rem;
    }

    .task-table tr:hover {
      background: #f8f9fa;
    }

    .task-table tr.late {
      background: rgba(231, 76, 60, 0.1);
    }

    .task-table tr.completed {
      background: rgba(46, 204, 113, 0.1);
    }

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
      font-size: 0.7rem;
      font-weight: 600;
      min-width: 30px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.not-started {
      background: #95a5a6;
      color: white;
    }

    .status-badge.in-progress {
      background: #3498db;
      color: white;
    }

    .status-badge.late {
      background: #e74c3c;
      color: white;
    }

    .status-badge.completed {
      background: #2ecc71;
      color: white;
    }

    @media (max-width: 1200px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      
      .chart-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 15px;
      }
      
      .chart-row {
        grid-template-columns: 1fr;
      }
      
      .task-table {
        font-size: 0.7rem;
      }
      
      .task-table th,
      .task-table td {
        padding: 8px 4px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
    protected dashboardService = inject(DashboardService);

    // Signals for component state
    public dashboardData = this.dashboardService.dashboardData;

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
            default:
                return 'Unknown';
        }
    }

    getResourceWorkloadPercentage(type: 'done' | 'todo'): number {
        const data = this.dashboardData();
        if (!data?.resourceWorkload) return 0;

        const total = data.resourceWorkload.done + data.resourceWorkload.leftToDo;
        if (total === 0) return 0;

        if (type === 'done') {
            return (data.resourceWorkload.done / total) * 100;
        } else {
            return (data.resourceWorkload.leftToDo / total) * 100;
        }
    }

    getTaskCompletionDashArray(type: 'onTrack' | 'late'): string {
        const data = this.dashboardData();
        if (!data?.taskCompletion) return '0 100';

        const total = this.dashboardService.totalTasks();
        if (total === 0) return '0 100';

        if (type === 'onTrack') {
            const percentage = (data.taskCompletion.onTrack / total) * 100;
            return `${percentage} ${100 - percentage}`;
        } else {
            const percentage = (data.taskCompletion.late / total) * 100;
            return `${percentage} ${100 - percentage}`;
        }
    }

    getActiveTasksDashArray(type: 'completed' | 'inProgress' | 'notStarted'): string {
        const data = this.dashboardData();
        if (!data?.activeTasks) return '0 100';

        const total = data.activeTasks.completed +
            data.activeTasks.inProgress +
            data.activeTasks.notStarted;

        if (total === 0) return '0 100';

        let value = 0;
        switch (type) {
            case 'completed':
                value = data.activeTasks.completed;
                break;
            case 'inProgress':
                value = data.activeTasks.inProgress;
                break;
            case 'notStarted':
                value = data.activeTasks.notStarted;
                break;
        }

        const percentage = (value / total) * 100;
        return `${percentage} ${100 - percentage}`;
    }
}

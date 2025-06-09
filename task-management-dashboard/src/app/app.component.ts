// src/app/app.component.ts - Add navigation handling

import { Component, signal, ViewChild } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';
import { FixturesComponent } from './components/fixtures/fixtures.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent, TaskManagementComponent, FixturesComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'task-management-dashboard';
  activeTab = signal('dashboard');
  highlightedTaskId = signal<number | null>(null);


  @ViewChild(TaskManagementComponent) taskManagementComponent!: TaskManagementComponent;

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
    // Clear highlighted task when switching tabs
    if (tab !== 'tasks') {
      this.highlightedTaskId.set(null);
    }
  }

  // Handle navigation from fixtures to task management
  onNavigateToTask(taskId: number): void {
    this.highlightedTaskId.set(taskId);
    this.setActiveTab('tasks');

    // Optional: scroll to task after view update
    setTimeout(() => {
      this.scrollToTask(Number(taskId));
    }, 100);
  }

  onSwitchToTaskManagement(): void {
    this.setActiveTab('tasks');
  }

  private scrollToTask(taskId: number): void {
    // Try to find and scroll to the task element
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Add highlight effect
      taskElement.classList.add('task-highlighted');
      setTimeout(() => {
        taskElement.classList.remove('task-highlighted');
      }, 3000);
    }
  }
}
// src/app/app.component.ts - Enhanced navigation handling with customer filtering

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
    console.log('Switching to tab:', tab);
    this.activeTab.set(tab);

    // Clear highlighted task when switching tabs (except when going to tasks)
    if (tab !== 'tasks') {
      this.highlightedTaskId.set(null);
    }
  }

  // Handle navigation from fixtures to task management with customer filtering
  onNavigateToTask(taskId: number): void {
    console.log('Navigation requested for task ID:', taskId);

    // Set the highlighted task
    this.highlightedTaskId.set(taskId);

    // Switch to task management tab
    this.setActiveTab('tasks');

    // Scroll to task after view update
    setTimeout(() => {
      this.scrollToTask(taskId);
    }, 200);
  }

  // NEW: Handle navigation with customer filtering
  onNavigateToTaskWithCustomer(data: { taskId: number, customerName: string }): void {
    console.log('Navigation requested for task ID:', data.taskId, 'with customer filter:', data.customerName);

    // Set the highlighted task
    this.highlightedTaskId.set(data.taskId);

    // Switch to task management tab
    this.setActiveTab('tasks');

    // Apply customer filter and scroll to task after view update
    setTimeout(() => {
      this.applyCustomerFilter(data.customerName);
      this.scrollToTask(data.taskId);
    }, 200);
  }

  private applyCustomerFilter(customerName: string): void {
    console.log('Applying customer filter:', customerName);

    // Get the task management component and apply filter
    if (this.taskManagementComponent) {
      this.taskManagementComponent.applyCustomerFilter(customerName);
    } else {
      // If component not ready, try again after a delay
      setTimeout(() => {
        if (this.taskManagementComponent) {
          this.taskManagementComponent.applyCustomerFilter(customerName);
        }
      }, 100);
    }
  }

  onSwitchToTaskManagement(): void {
    console.log('Switching to task management');
    this.setActiveTab('tasks');
  }

  private scrollToTask(taskId: number): void {
    console.log('Attempting to scroll to task:', taskId);

    // Try to find and scroll to the task element
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      console.log('Found task element, scrolling...');
      taskElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Add highlight effect
      taskElement.classList.add('task-highlighted');
      setTimeout(() => {
        taskElement.classList.remove('task-highlighted');
        // Clear the highlighted task after animation
        this.highlightedTaskId.set(null);
      }, 3000);
    } else {
      console.log('Task element not found, will try again...');
      // If element not found, try again after a longer delay
      setTimeout(() => {
        const retryElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (retryElement) {
          console.log('Found task element on retry, scrolling...');
          retryElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          retryElement.classList.add('task-highlighted');
          setTimeout(() => {
            retryElement.classList.remove('task-highlighted');
            this.highlightedTaskId.set(null);
          }, 3000);
        } else {
          console.log('Task element still not found after retry');
          // Clear highlighted task if we can't find it
          this.highlightedTaskId.set(null);
        }
      }, 500);
    }
  }
}
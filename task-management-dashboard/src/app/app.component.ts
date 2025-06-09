// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent, TaskManagementComponent, CommonModule],
  templateUrl: './app.component.html', // Point to the HTML file
  styleUrls: ['./app.component.css']    // Point to the CSS file
})
export class AppComponent {
  title = 'task-management-dashboard';
  activeTab = signal('dashboard');

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }
}
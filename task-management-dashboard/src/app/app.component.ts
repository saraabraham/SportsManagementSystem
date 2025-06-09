// src/app/app.component.ts - Updated with navigation
import { Component, signal } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TaskManagementComponent } from './components/task-management/task-management.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent, TaskManagementComponent, CommonModule],
  template: `
    <div class="app-container">
      <header class="header">
        <div class="header-content">
          <h1>TASK LIST & RESOURCING</h1>
          <p>SPORTS MANAGEMENT DASHBOARD</p>
        </div>
        <nav class="nav-tabs">
          <button 
            class="nav-tab" 
            [class.active]="activeTab() === 'dashboard'"
            (click)="setActiveTab('dashboard')">
            <i class="fas fa-chart-pie"></i>
            Dashboard
          </button>
          <button 
            class="nav-tab" 
            [class.active]="activeTab() === 'tasks'"
            (click)="setActiveTab('tasks')">
            <i class="fas fa-tasks"></i>
            Task Management
          </button>
        </nav>
      </header>

      <main class="main-content">
        @if (activeTab() === 'dashboard') {
          <app-dashboard />
        } @else if (activeTab() === 'tasks') {
          <app-task-management />
        }
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .header {
      background: rgba(44, 62, 80, 0.95);
      backdrop-filter: blur(10px);
      color: white;
      padding: 20px 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      text-align: center;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0;
      letter-spacing: 2px;
      background: linear-gradient(45deg, #3498db, #2ecc71);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header p {
      font-size: 1.1rem;
      margin: 10px 0;
      opacity: 0.9;
      font-weight: 300;
    }

    .nav-tabs {
      display: flex;
      justify-content: center;
      gap: 0;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50px;
      padding: 4px;
      max-width: 400px;
      margin: 0 auto;
    }

    .nav-tab {
      flex: 1;
      padding: 12px 24px;
      border: none;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      border-radius: 46px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 500;
      font-size: 0.95rem;
    }

    .nav-tab:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-tab.active {
      background: linear-gradient(45deg, #3498db, #2ecc71);
      color: white;
      box-shadow: 0 4px 15px rgba(52, 152, 219, 0.4);
      transform: translateY(-1px);
    }

    .nav-tab i {
      font-size: 1rem;
    }

    .main-content {
      padding: 30px 20px;
      max-width: 1600px;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8rem;
      }

      .header p {
        font-size: 0.95rem;
      }

      .nav-tabs {
        max-width: 100%;
        margin: 0 20px;
      }

      .nav-tab {
        padding: 10px 16px;
        font-size: 0.85rem;
      }

      .nav-tab i {
        font-size: 0.9rem;
      }

      .main-content {
        padding: 20px 10px;
      }
    }

    @media (max-width: 480px) {
      .nav-tab span {
        display: none;
      }

      .nav-tab {
        padding: 12px;
      }
    }
  `]
})
export class AppComponent {
  title = 'task-management-dashboard';
  activeTab = signal('dashboard');

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }
}
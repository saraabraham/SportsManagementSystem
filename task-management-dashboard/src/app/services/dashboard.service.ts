import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DashboardData, TaskItem, Resource } from '../models/task.model';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    // Angular 19 Signals for reactive state management
    private dashboardDataSubject = new BehaviorSubject<DashboardData | null>(null);
    public dashboardData$ = this.dashboardDataSubject.asObservable();

    // Signals for reactive UI
    public dashboardData = signal<DashboardData | null>(null);
    public loading = signal<boolean>(false);
    public error = signal<string | null>(null);

    // Computed signals
    public totalTasks = computed(() => {
        const data = this.dashboardData();
        return data?.taskCompletion ? data.taskCompletion.onTrack + data.taskCompletion.late : 0;
    });

    public taskGroups = computed(() => {
        const data = this.dashboardData();
        if (!data?.tasks) return [];

        const groups = data.tasks.reduce((acc: Record<string, TaskItem[]>, task) => {
            if (!acc[task.groupTask]) {
                acc[task.groupTask] = [];
            }
            acc[task.groupTask].push(task);
            return acc;
        }, {});

        return Object.entries(groups).map(([name, tasks]) => ({ name, tasks }));
    });

    getDashboardData(): Observable<DashboardData> {
        this.loading.set(true);
        this.error.set(null);

        return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`)
            .pipe(
                retry(2),
                tap(data => {
                    this.dashboardData.set(data);
                    this.dashboardDataSubject.next(data);
                    this.loading.set(false);
                }),
                catchError(error => {
                    this.loading.set(false);
                    this.error.set(this.getErrorMessage(error));
                    return this.handleError(error);
                })
            );
    }

    getTasks(): Observable<TaskItem[]> {
        return this.http.get<TaskItem[]>(`${this.apiUrl}/tasks`)
            .pipe(
                retry(2),
                catchError(this.handleError)
            );
    }

    getResources(): Observable<Resource[]> {
        return this.http.get<Resource[]>(`${this.apiUrl}/resources`)
            .pipe(
                retry(2),
                catchError(this.handleError)
            );
    }

    updateTask(id: number, task: TaskItem): Observable<TaskItem> {
        return this.http.put<TaskItem>(`${this.apiUrl}/tasks/${id}`, task)
            .pipe(
                tap(() => this.refreshDashboardData()),
                catchError(this.handleError)
            );
    }

    createTask(task: TaskItem): Observable<TaskItem> {
        return this.http.post<TaskItem>(`${this.apiUrl}/tasks`, task)
            .pipe(
                tap(() => this.refreshDashboardData()),
                catchError(this.handleError)
            );
    }

    deleteTask(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/tasks/${id}`)
            .pipe(
                tap(() => this.refreshDashboardData()),
                catchError(this.handleError)
            );
    }

    private refreshDashboardData(): void {
        this.getDashboardData().subscribe();
    }

    private getErrorMessage(error: HttpErrorResponse): string {
        if (error.error instanceof ErrorEvent) {
            return `Error: ${error.error.message}`;
        } else {
            return `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
    }

    private handleError = (error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        console.error(errorMessage);
        return throwError(() => errorMessage);
    };
}
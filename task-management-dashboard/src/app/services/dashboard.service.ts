import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DashboardData, TaskItem, Resource } from '../models/task.model';
import { CreateTaskRequest } from '../models/task.model';

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
        return data?.TaskCompletion ? data.TaskCompletion.OnTrack + data.TaskCompletion.Late : 0;
    });

    public taskGroups = computed(() => {
        const data = this.dashboardData();
        if (!data?.Tasks) return [];

        const groups = data.Tasks.reduce((acc: Record<string, TaskItem[]>, task) => {
            if (!acc[task.GroupTask]) {
                acc[task.GroupTask] = [];
            }
            acc[task.GroupTask].push(task);
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

    createTask(task: CreateTaskRequest): Observable<TaskItem> {
        // This assumes your backend returns a full TaskItem object after creation
        return this.http.post<TaskItem>(`${this.apiUrl}/tasks`, task).pipe(
            tap(newTask => {
                console.log('Task created on backend:', newTask);
                // Optimistically update the local signal after creation
                const currentData = this.dashboardData();
                if (currentData) {
                    const updatedTasks = [...(currentData.Tasks || []), newTask];
                    this.dashboardData.set({ ...currentData, Tasks: updatedTasks });
                }
            }),
            catchError(err => {
                console.error('Error creating task:', err);
                return throwError(() => new Error('Failed to create task'));
            })
        );
    }

    // 2. updateTask should accept the TaskItem ID and CreateTaskRequest data
    updateTask(id: number, taskData: CreateTaskRequest): Observable<TaskItem> {
        // This assumes your backend returns a full TaskItem object after update
        return this.http.put<TaskItem>(`${this.apiUrl}/tasks/${id}`, taskData).pipe(
            tap(updatedTask => {
                console.log('Task updated on backend:', updatedTask);
                // Optimistically update the local signal after update
                const currentData = this.dashboardData();
                if (currentData) {
                    const updatedTasks = (currentData.Tasks || []).map(t =>
                        t.Id === updatedTask.Id ? updatedTask : t
                    );
                    this.dashboardData.set({ ...currentData, Tasks: updatedTasks });
                }
            }),
            catchError(err => {
                console.error('Error updating task:', err);
                return throwError(() => new Error('Failed to update task'));
            })
        );
    }

    deleteTask(taskId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/tasks/${taskId}`).pipe(
            tap(() => {
                console.log('Task deleted on backend:', taskId);
                // Optimistically update the local signal after deletion
                const currentData = this.dashboardData();
                if (currentData) {
                    const updatedTasks = (currentData.Tasks || []).filter(t => t.Id !== taskId);
                    this.dashboardData.set({ ...currentData, Tasks: updatedTasks });
                }
            }),
            catchError(err => {
                console.error('Error deleting task:', err);
                return throwError(() => new Error('Failed to delete task'));
            })
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
// src/app/models/task.model.ts - Updated with new fields
export interface TaskItem {
    id: number;
    name: string;
    assignedTo: string;
    workRequired: number;
    deadline: Date;
    percentCompleted: number;
    status: TaskStatus;
    groupTask: string;
    // New fields
    customer: string;
    phoneNo: string;
    sportPlayed: string;
    updates: string;
    createdAt: Date;
    updatedAt?: Date;
}

export enum TaskStatus {
    NotStarted = 'NotStarted',
    InProgress = 'InProgress',
    Late = 'Late',
    Completed = 'Completed',
    OnHold = 'OnHold',
    Cancelled = 'Cancelled'
}

export interface Resource {
    id: number;
    name: string;
    workloadHours: number;
    status: ResourceStatus;
}

export enum ResourceStatus {
    Available = 'Available',
    Busy = 'Busy',
    Overloaded = 'Overloaded'
}

export interface DashboardData {
    taskCompletion: TaskCompletionStats;
    activeTasks: ActiveTaskStats;
    resourceWorkload: ResourceWorkloadStats;
    projectCompletion: ProjectCompletionStats;
    tasks: TaskItem[];
    resources: Resource[];
}

export interface TaskCompletionStats {
    onTrack: number;
    late: number;
}

export interface ActiveTaskStats {
    completed: number;
    inProgress: number;
    notStarted: number;
}

export interface ResourceWorkloadStats {
    done: number;
    leftToDo: number;
}

export interface ProjectCompletionStats {
    completionPercentage: number;
}

export interface TaskGroup {
    name: string;
    tasks: TaskItem[];
}

// DTO for creating/updating tasks
export interface CreateTaskRequest {
    name: string;
    assignedTo: string;
    workRequired: number;
    deadline: Date;
    percentCompleted: number;
    status: TaskStatus;
    groupTask: string;
    customer: string;
    phoneNo: string;
    sportPlayed: string;
    updates: string;
}

// Common sports list for dropdown
export const SPORTS_OPTIONS = [
    'Football',
    'Basketball',
    'Tennis',
    'Swimming',
    'Cricket',
    'Running',
    'Golf',
    'Boxing',
    'Volleyball',
    'Cycling',
    'Baseball',
    'Soccer',
    'Hockey',
    'Track & Field',
    'Wrestling',
    'Gymnastics',
    'Other'
];
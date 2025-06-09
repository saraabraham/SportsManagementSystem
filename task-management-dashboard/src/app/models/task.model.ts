// src/app/models/task.model.ts - Updated with new fields
import { TaskItemStatus } from '../enums/task-item-status.enum';
export interface TaskItem {
    Id: number;
    Name: string;
    AssignedTo: string;
    WorkRequired: number;
    Deadline: string; // Or Date, depending on your parsing
    PercentCompleted: number;
    Status: TaskItemStatus; // Make sure this matches TaskStatus enum values correctly
    GroupTask: string;
    Customer: string;
    PhoneNo: string;
    SportPlayed: string;
    Updates: string;
    CreatedAt: string; // Or Date
}


export interface Resource {
    Id: number;
    Name: string;
    WorkloadHours: number;
    Status: string;
}

export enum ResourceStatus {
    Available = 'Available',
    Busy = 'Busy',
    Overloaded = 'Overloaded'
}

export interface DashboardData {
    TaskCompletion: TaskCompletionStats;
    ActiveTasks: ActiveTaskStats;
    ResourceWorkload: ResourceWorkloadStats;
    ProjectCompletion: ProjectCompletionStats;
    Tasks: TaskItem[];   // Changed from 'tasks' to 'Tasks'
    Resources: Resource[];
}


export interface TaskCompletionStats {
    OnTrack: number; // Changed from 'onTrack' to 'OnTrack'
    Late: number;    // Changed from 'late' to 'Late'
}


export interface ActiveTaskStats {
    Completed: number;  // Changed from 'completed' to 'Completed'
    InProgress: number; // Changed from 'inProgress' to 'InProgress'
    NotStarted: number; // Changed from 'notStarted' to 'NotStarted'
}

export interface ResourceWorkloadStats {
    Done: number;       // Changed from 'done' to 'Done'
    LeftToDo: number;   // Changed from 'leftToDo' to 'LeftToDo'
}

export interface ProjectCompletionStats {
    CompletionPercentage: number; // Changed from 'completionPercentage' to 'CompletionPercentage'
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
    status: TaskItemStatus;
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
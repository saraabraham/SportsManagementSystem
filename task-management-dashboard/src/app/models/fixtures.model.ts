// src/app/models/fixtures.model.ts
export interface TimeSlot {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string; // Format: "HH:mm"
    endTime: string;   // Format: "HH:mm"
    sport: string;
    attendees: Attendee[];
    maxCapacity?: number;
    location?: string;
    notes?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Attendee {
    id: string;
    name: string;
    isPresent: boolean;
    checkedInAt?: Date;
    contactInfo?: ContactInfo;
    pendingTasksCount?: number;
}

export interface ContactInfo {
    email?: string;
    phone?: string;
}

export enum DayOfWeek {
    Monday = 'Monday',
    Tuesday = 'Tuesday',
    Wednesday = 'Wednesday',
    Thursday = 'Thursday',
    Friday = 'Friday',
    Saturday = 'Saturday',
    Sunday = 'Sunday'
}

export interface WeeklySchedule {
    weekStartDate: Date;
    weekEndDate: Date;
    timeSlots: TimeSlot[];
}

export interface CreateTimeSlotRequest {
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    sport: string;
    maxCapacity?: number;
    location?: string;
    notes?: string;
}

export interface AddAttendeeRequest {
    timeSlotId: string;
    name: string;
    contactInfo?: ContactInfo;
}

export interface AttendanceUpdate {
    timeSlotId: string;
    attendeeId: string;
    isPresent: boolean;
    checkedInAt?: Date;
}

// Common time slots for easy selection
export const COMMON_TIME_SLOTS = [
    { start: '06:00', end: '07:00', label: '6:00 AM - 7:00 AM' },
    { start: '07:00', end: '08:00', label: '7:00 AM - 8:00 AM' },
    { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
    { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
    { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
    { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
    { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
    { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
    { start: '17:00', end: '18:00', label: '5:00 PM - 6:00 PM' },
    { start: '18:00', end: '19:00', label: '6:00 PM - 7:00 PM' },
    { start: '19:00', end: '20:00', label: '7:00 PM - 8:00 PM' },
    { start: '20:00', end: '21:00', label: '8:00 PM - 9:00 PM' }
];

export const DAYS_OF_WEEK = [
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
    DayOfWeek.Sunday
];
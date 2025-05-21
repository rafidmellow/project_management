/**
 * Attendance Management Types
 *
 * This file contains all type definitions related to attendance tracking in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

/**
 * Base Attendance interface representing the core attendance record
 */
export interface Attendance {
  id: string;
  userId: string;
  checkInTime: string | Date;
  checkOutTime?: string | Date | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkInIpAddress?: string | null;
  checkOutIpAddress?: string | null;
  checkInDeviceInfo?: string | null;
  checkOutDeviceInfo?: string | null;
  totalHours?: number | null;
  notes?: string | null;
  checkInLocationName?: string | null;
  checkOutLocationName?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  autoCheckout: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Attendance with related entities
 */
export interface AttendanceWithRelations extends Attendance {
  user?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role?: string;
  };
  project?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
  correctionRequests?: AttendanceCorrectionRequest[];
  // Flag for offline sync status
  pendingSync?: boolean;
}

/**
 * Attendance Settings interface
 */
export interface AttendanceSettings {
  id: string;
  userId: string;
  workHoursPerDay: number;
  workDays: string;
  reminderEnabled: boolean;
  reminderTime?: string | null;
  autoCheckoutEnabled: boolean;
  autoCheckoutTime?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Attendance Correction Request interface
 */
export interface AttendanceCorrectionRequest {
  id: string;
  attendanceId: string;
  userId: string;
  originalCheckInTime: string | Date;
  originalCheckOutTime?: string | Date | null;
  requestedCheckInTime: string | Date;
  requestedCheckOutTime?: string | Date | null;
  reason: string;
  status: AttendanceCorrectionStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | Date | null;
  reviewNotes?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  attendance?: Attendance;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  reviewer?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

/**
 * Attendance Correction Status type
 */
export type AttendanceCorrectionStatus = 'pending' | 'approved' | 'rejected';

/**
 * Attendance Statistics interface
 */
export interface AttendanceStatistics {
  period: string;
  totalHours: number;
  averageHours: number;
  attendanceDays: number;
  totalWorkingDays: number;
  daysOnTime: number;
  daysLate: number;
  attendanceRate: number;
  onTimeRate: number;
  startDate: string;
  endDate: string;
}

/**
 * Attendance Summary interface
 */
export interface AttendanceSummary {
  totalRecords: number;
  totalHours: number;
  userCount: number;
}

/**
 * Attendance Group interface (for grouped history)
 */
export interface AttendanceGroup {
  period: string;
  records: AttendanceWithRelations[];
  totalHours: number;
  uniqueDaysCount: number;
  averageHoursPerDay: number;
  checkInCount?: number;
}

/**
 * Attendance Check-In DTO
 */
export interface AttendanceCheckInDTO {
  latitude?: number;
  longitude?: number;
  projectId?: string;
  taskId?: string;
  notes?: string;
}

/**
 * Attendance Check-Out DTO
 */
export interface AttendanceCheckOutDTO {
  latitude?: number;
  longitude?: number;
  attendanceId?: string;
  notes?: string;
}

/**
 * Attendance Settings Update DTO
 */
export interface UpdateAttendanceSettingsDTO {
  workHoursPerDay: number;
  workDays: string;
  reminderEnabled: boolean;
  reminderTime?: string | null;
  autoCheckoutEnabled: boolean;
  autoCheckoutTime?: string | null;
}

/**
 * Attendance Correction Request DTO
 */
export interface AttendanceCorrectionRequestDTO {
  attendanceId: string;
  requestedCheckInTime: string;
  requestedCheckOutTime?: string | null;
  reason: string;
}

/**
 * Attendance Correction Review DTO
 */
export interface AttendanceCorrectionReviewDTO {
  id: string;
  status: 'approved' | 'rejected';
  reviewNotes?: string;
}

/**
 * Attendance Filter Options
 */
export interface AttendanceFilterOptions {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'custom';
  projectId?: string;
  taskId?: string;
  userId?: string;
  groupBy?: 'day' | 'week' | 'month';
  page?: number;
  limit?: number;
}

/**
 * Attendance API Response
 */
export interface AttendanceResponse {
  attendance: AttendanceWithRelations;
  error?: string;
}

/**
 * Attendance List API Response
 */
export interface AttendanceListResponse {
  records: AttendanceWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Attendance History API Response
 */
export interface AttendanceHistoryResponse {
  records: AttendanceWithRelations[];
  groupedRecords?: AttendanceGroup[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalHours: number;
    averageHoursPerDay: number;
    uniqueDaysCount: number;
  };
}

/**
 * Attendance Statistics API Response
 */
export interface AttendanceStatsResponse {
  stats: AttendanceStatistics;
}

/**
 * Attendance Settings API Response
 */
export interface AttendanceSettingsResponse {
  settings: AttendanceSettings;
}

/**
 * Attendance Correction Requests API Response
 */
export interface AttendanceCorrectionRequestsResponse {
  requests: AttendanceCorrectionRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

'use client';

import { AttendanceHistory } from '@/components/attendance/attendance-history';

export default function AttendanceHistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
          <p className="text-muted-foreground">View and manage your attendance records</p>
        </div>
      </div>

      <AttendanceHistory />
    </div>
  );
}

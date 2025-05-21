'use client';

import { AttendanceStats } from '@/components/attendance/attendance-stats';

export default function AttendanceStatsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Statistics</h1>
          <p className="text-muted-foreground">Analyze your attendance patterns and trends</p>
        </div>
      </div>

      <AttendanceStats />
    </div>
  );
}

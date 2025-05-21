'use client';

import { AttendanceSettingsForm } from '@/components/attendance/attendance-settings-form';
import { Settings } from 'lucide-react';

export default function AttendanceSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Settings</h1>
          <p className="text-muted-foreground">
            Configure your work schedule and attendance preferences
          </p>
        </div>
      </div>

      <AttendanceSettingsForm />
    </div>
  );
}

'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';

// Note: Metadata is moved to a separate file or removed to avoid conflicts with 'use client'

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </AuthGuard>
  );
}

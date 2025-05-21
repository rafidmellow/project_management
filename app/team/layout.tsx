'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </AuthGuard>
  );
}

'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { UserNav } from '@/components/user-nav';
import { AuthGuard } from '@/components/auth-guard';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <DashboardLayout>{children}</DashboardLayout>
      </div>
    </AuthGuard>
  );
}

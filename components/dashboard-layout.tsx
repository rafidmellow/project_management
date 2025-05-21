'use client';

import dynamic from 'next/dynamic';
import ServerSideLayout from './server-side-layout';

// Import client-side layout with SSR disabled
const ClientSideLayout = dynamic(() => import('./client-side-layout'), {
  ssr: false,
  loading: () => <ServerSideLayout>{null}</ServerSideLayout>,
});

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
      <ClientSideLayout>{children}</ClientSideLayout>
    </div>
  );
}

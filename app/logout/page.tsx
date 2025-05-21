'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { checkOutAndLogout } from '@/lib/logout-utils';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // This will check out the user if needed, then log them out
        await checkOutAndLogout('/login');
      } catch (error) {
        console.error('Error during logout:', error);
        // Force redirect to login even if there's an error
        router.push('/login');
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="mt-4 text-muted-foreground">Logging out...</p>
    </div>
  );
}

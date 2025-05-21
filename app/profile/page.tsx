'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/spinner';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.id) {
      router.push(`/profile/${session.user.id}`);
    }
  }, [router, session, status]);

  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

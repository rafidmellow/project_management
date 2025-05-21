'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function OfflineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Get the return URL from query params or use a default
  const returnUrl = searchParams?.get('returnUrl') || '/attendance/dashboard';

  // Store the return URL in sessionStorage for persistence across page refreshes
  useEffect(() => {
    if (typeof window !== 'undefined' && returnUrl) {
      sessionStorage.setItem('offlineReturnUrl', returnUrl);
    }
  }, [returnUrl]);

  // Get the stored return URL or use the default
  const getReturnUrl = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('offlineReturnUrl') || '/attendance/dashboard';
    }
    return '/attendance/dashboard';
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Redirect after a short delay to allow the browser to establish connection
      setTimeout(() => {
        const url = getReturnUrl();
        console.log('Redirecting to:', url);
        router.push(url);
      }, 1500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  // Function to handle manual navigation
  const handleManualReturn = () => {
    const url = getReturnUrl();
    router.push(url);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">You're Offline</CardTitle>
          <CardDescription>
            {isOnline
              ? 'Connection restored! Redirecting you back...'
              : 'Your device is currently offline. Some features may be limited.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p className="mb-4">
            {isOnline
              ? "Your connection has been restored. You'll be redirected back to where you were automatically."
              : "Don't worry, any attendance actions you take will be synchronized when you're back online."}
          </p>
          {isOnline && (
            <div className="flex justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}

          {!isOnline && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h3 className="font-medium text-sm mb-2">Available Offline:</h3>
              <ul className="text-xs text-left space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-2 h-2"></span>
                  Viewing cached attendance records
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 rounded-full w-2 h-2"></span>
                  Check-in and check-out (will sync when online)
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 rounded-full w-2 h-2"></span>
                  Limited navigation to cached pages
                </li>
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {!isOnline && (
            <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          {isOnline ? (
            <Button onClick={handleManualReturn} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return Now
            </Button>
          ) : (
            <Button asChild className="gap-2">
              <Link href="/attendance/dashboard">
                <Home className="h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// Wrap the component with Suspense to handle useSearchParams
export default function OfflinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/20">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <WifiOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">You're Offline</CardTitle>
              <CardDescription>
                Your device is currently offline. Some features may be limited.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p>Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <OfflineContent />
    </Suspense>
  );
}

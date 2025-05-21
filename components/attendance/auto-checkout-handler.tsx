'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { AttendanceSettings } from '@/types/attendance';
import {
  isBackgroundSyncSupported,
  registerAutoCheckoutSync,
  listenForServiceWorkerMessages,
} from '@/lib/service-worker';

/**
 * AutoCheckoutHandler component
 *
 * This component runs in the background and handles auto-checkout functionality.
 * It periodically checks if the user should be automatically checked out based on their settings.
 */
export function AutoCheckoutHandler() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [nextCheckTime, setNextCheckTime] = useState<Date | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  // Fetch attendance settings
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/attendance/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching attendance settings:', error);
      }
    };

    fetchSettings();
    // Refresh settings every 30 minutes
    const interval = setInterval(fetchSettings, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Check if user is currently checked in
  useEffect(() => {
    if (!session?.user?.id) return;

    const checkAttendanceStatus = async () => {
      try {
        const response = await fetch('/api/attendance/current', {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setIsCheckedIn(!!data.attendance && !data.attendance.checkOutTime);
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
      }
    };

    checkAttendanceStatus();
    // Check status every 5 minutes
    const interval = setInterval(checkAttendanceStatus, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  // Set up auto-checkout timer
  useEffect(() => {
    if (!settings?.autoCheckoutEnabled || !isCheckedIn || !settings.autoCheckoutTime) {
      setNextCheckTime(null);
      return;
    }

    // Parse auto-checkout time
    const [hours, minutes] = settings.autoCheckoutTime.split(':').map(Number);
    const now = new Date();
    const checkoutTime = new Date();
    checkoutTime.setHours(hours, minutes, 0, 0);

    // If the checkout time has already passed today, don't schedule
    if (now > checkoutTime) {
      return;
    }

    setNextCheckTime(checkoutTime);

    // Calculate milliseconds until checkout time
    const timeUntilCheckout = checkoutTime.getTime() - now.getTime();

    // Set timeout for auto-checkout
    const timeoutId = setTimeout(() => {
      performAutoCheckout();
    }, timeUntilCheckout);

    // Also register for background sync as a backup
    if (isBackgroundSyncSupported()) {
      registerAutoCheckoutSync().catch(err => {
        console.error('Failed to register auto-checkout sync:', err);
      });
    }

    return () => clearTimeout(timeoutId);
  }, [settings, isCheckedIn]);

  // Perform the actual auto-checkout
  const performAutoCheckout = async () => {
    if (!session?.user?.id || !isCheckedIn) return;

    try {
      const response = await fetch('/api/attendance/auto-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.checked_out) {
          setIsCheckedIn(false);
          toast({
            title: 'Auto-checkout completed',
            description: `You've been automatically checked out at ${settings?.autoCheckoutTime}`,
            duration: 5000,
          });
        }
      }
    } catch (error) {
      console.error('Error performing auto-checkout:', error);
    }
  };

  // Listen for service worker messages
  useEffect(() => {
    if (!session?.user?.id) return;

    const cleanup = listenForServiceWorkerMessages(data => {
      if (data.type === 'AUTO_CHECKOUT_COMPLETED') {
        setIsCheckedIn(false);
        toast({
          title: 'Auto-checkout completed',
          description: `You've been automatically checked out by the system`,
          duration: 5000,
        });
      }
    });

    return cleanup;
  }, [session?.user?.id, toast]);

  // This component doesn't render anything visible
  return null;
}

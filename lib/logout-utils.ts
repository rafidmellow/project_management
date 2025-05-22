'use client';

import { signOut } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

/**
 * Checks out the user (if currently checked in) and then logs them out
 * @param callbackUrl Optional URL to redirect to after logout
 */
export async function checkOutAndLogout(callbackUrl: string = '/login') {
  try {
    // Check if we're online before attempting to fetch
    if (!navigator.onLine) {
      await signOut({ callbackUrl });
      return;
    }

    // First, check if the user is currently checked in
    const response = await fetch('/api/attendance/current', {
      // Add cache control to ensure we get fresh data
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      await signOut({ callbackUrl });
      return;
    }

    const data = await response.json();

    // If the user is checked in (has an active attendance record without checkout time)
    if (data.attendance && !data.attendance.checkOutTime) {
      try {
        // Get current position if available, with timeout to prevent hanging
        let position: GeolocationPosition | null = null;
        const positionPromise = getCurrentPosition().catch(err => {
          return null;
        });

        // Set a timeout for position acquisition to avoid hanging the logout process
        const timeoutPromise = new Promise<null>(resolve => {
          setTimeout(() => resolve(null), 3000); // 3 second timeout
        });

        // Race between position acquisition and timeout
        position = await Promise.race([positionPromise, timeoutPromise]);

        // Use the dedicated auto-checkout endpoint with force flag
        const checkOutData = {
          forceCheckout: true, // Force checkout regardless of settings
          latitude: position?.coords?.latitude,
          longitude: position?.coords?.longitude,
        };

        // Call the auto-checkout API with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          const checkoutResponse = await fetch('/api/attendance/auto-checkout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkOutData),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (checkoutResponse.ok) {
            const checkoutData = await checkoutResponse.json();
            if (checkoutData.checked_out) {
              toast({
                title: 'Checked Out',
                description: "You've been checked out as part of the logout process.",
              });
            }
          } else {
            // Silently continue if checkout fails
          }
        } catch (fetchError) {
          // Continue with logout regardless of any errors
        }
      } catch (error) {
        // Continue with logout even if checkout fails
      }
    }

    // Finally, log the user out
    await signOut({ callbackUrl });
  } catch (error) {
    // If anything fails, still try to log the user out
    await signOut({ callbackUrl });
  }
}

/**
 * Get current position with geolocation API
 */
/**
 * Get current position with geolocation API and improved error handling
 * @returns Promise resolving to GeolocationPosition or rejecting with error
 */
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => {
        // Provide more helpful error messages based on error code
        let errorMessage = 'Unable to retrieve your location.';

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'Location permission denied. Please check your browser settings.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'Your location is currently unavailable. Try again later.';
            break;
          case 3: // TIMEOUT
            errorMessage = 'Location request timed out. Check your connection.';
            break;
        }

        const enhancedError = new Error(errorMessage);
        enhancedError.name = 'GeolocationError';
        // @ts-expect-error - Service worker registration may not be available in all environments - Add the original error code for reference
        enhancedError.code = error.code;

        reject(enhancedError);
      },
      {
        enableHighAccuracy: false, // Use lower accuracy for faster response during logout
        timeout: 3000, // Shorter timeout for logout context
        maximumAge: 60000, // Accept positions up to 1 minute old
      }
    );
  });
}

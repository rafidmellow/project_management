/**
 * Utility functions for geolocation
 */
import { GeoLocationResult, LocationNameResult } from '@/types/service';

/**
 * Reverse geocode coordinates to get location name
 * Uses the Nominatim OpenStreetMap API
 */
export async function getLocationName(
  latitude: number | null,
  longitude: number | null
): Promise<string> {
  try {
    // If coordinates are not provided, return a default message
    if (latitude === null || longitude === null) {
      return 'Location information not available';
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ProjectPro Attendance System',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = (await response.json()) as LocationNameResult;

    // Format the address based on available data
    if (data.display_name) {
      // Try to create a more concise address
      const address = data.address;
      if (address) {
        const parts = [];

        // Add road/street if available
        if (address.road || address.street) {
          parts.push(address.road || address.street);
        }

        // Add suburb/neighborhood if available
        if (address.suburb || address.neighbourhood) {
          parts.push(address.suburb || address.neighbourhood);
        }

        // Add city/town if available
        if (address.city || address.town || address.village) {
          parts.push(address.city || address.town || address.village);
        }

        // Add state/province if available
        if (address.state || address.province) {
          parts.push(address.state || address.province);
        }

        // Add country if available
        if (address.country) {
          parts.push(address.country);
        }

        if (parts.length > 0) {
          return parts.join(', ');
        }
      }

      // Fallback to display_name if we couldn't create a concise address
      return data.display_name;
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Location information unavailable';
  }
}

/**
 * Get device information from user agent
 */
export function getDeviceInfo(userAgent: string): string {
  try {
    // Extract browser information
    const browserRegex = /(chrome|safari|firefox|msie|trident|edge|opera)\/?\s*(\d+(\.\d+)*)/i;
    const browserMatch = userAgent.match(browserRegex);
    const browser = browserMatch
      ? `${browserMatch[1].charAt(0).toUpperCase() + browserMatch[1].slice(1)} ${browserMatch[2]}`
      : 'Unknown Browser';

    // Extract OS information
    let os = 'Unknown OS';
    if (userAgent.indexOf('Windows') !== -1) {
      os = 'Windows';
    } else if (userAgent.indexOf('Mac') !== -1) {
      os = 'MacOS';
    } else if (userAgent.indexOf('Linux') !== -1) {
      os = 'Linux';
    } else if (userAgent.indexOf('Android') !== -1) {
      os = 'Android';
    } else if (
      userAgent.indexOf('iOS') !== -1 ||
      userAgent.indexOf('iPhone') !== -1 ||
      userAgent.indexOf('iPad') !== -1
    ) {
      os = 'iOS';
    }

    // Extract device type
    let deviceType = 'Desktop';
    if (userAgent.indexOf('Mobile') !== -1) {
      deviceType = 'Mobile';
    } else if (userAgent.indexOf('Tablet') !== -1 || userAgent.indexOf('iPad') !== -1) {
      deviceType = 'Tablet';
    }

    // Extract device name
    let deviceName = 'Unknown Device';
    if (userAgent.indexOf('iPhone') !== -1) {
      deviceName = 'iPhone';
    } else if (userAgent.indexOf('iPad') !== -1) {
      deviceName = 'iPad';
    } else if (userAgent.indexOf('Android') !== -1) {
      // Try to extract Android device model
      const androidModelMatch = userAgent.match(
        /Android[\s\/]([\d\.]+)[;\)](?:[^;]*;)*\s([^;]*[^\s;])/i
      );
      if (androidModelMatch && androidModelMatch[2]) {
        deviceName = androidModelMatch[2].trim();
      } else {
        deviceName = 'Android Device';
      }
    } else if (userAgent.indexOf('Macintosh') !== -1) {
      deviceName = 'Mac';
    } else if (userAgent.indexOf('Windows') !== -1) {
      deviceName = 'PC';
    } else if (userAgent.indexOf('Linux') !== -1) {
      deviceName = 'Linux PC';
    }

    return `${deviceName} - ${deviceType} - ${os} - ${browser}`;
  } catch (error) {
    console.error('Error parsing device info:', error);
    return 'Unknown device';
  }
}

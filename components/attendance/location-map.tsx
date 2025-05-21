'use client';

import { useEffect, useRef } from 'react';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

export function LocationMap({
  latitude,
  longitude,
  className = 'h-40 w-full rounded-md overflow-hidden',
}: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the OpenStreetMap iframe when the component mounts
    if (mapRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.01}%2C${latitude - 0.01}%2C${longitude + 0.01}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;

      // Clear any existing content and append the iframe
      mapRef.current.innerHTML = '';
      mapRef.current.appendChild(iframe);
    }

    return () => {
      // Clean up when component unmounts
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }
    };
  }, [latitude, longitude]);

  return (
    <div ref={mapRef} className={className}>
      <div className="flex items-center justify-center h-full bg-muted text-muted-foreground text-sm">
        Loading map...
      </div>
    </div>
  );
}

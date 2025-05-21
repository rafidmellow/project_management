'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        fetcher: async (resource, init) => {
          const res = await fetch(resource, init);
          if (!res.ok) {
            const error = new Error('An error occurred while fetching the data.');
            // @ts-ignore
            error.info = await res.json();
            // @ts-ignore
            error.status = res.status;
            throw error;
          }
          return res.json();
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

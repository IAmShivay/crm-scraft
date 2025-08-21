"use client";

import { Provider } from 'react-redux';
import { store } from '@/lib/store/store';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useActivityLogger } from '@/lib/hooks/useActivityLogger';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize the activity logger to track auth state changes
  useActivityLogger();

  return (
    <Provider store={store}>
      <WorkspaceProvider>
        <TooltipProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </TooltipProvider>
      </WorkspaceProvider>
    </Provider>
  );
}
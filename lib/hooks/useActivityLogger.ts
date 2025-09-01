"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { logger } from "@/lib/logger";

/**
 * Hook to automatically log authentication activities
 * This integrates with Supabase auth events without breaking existing functionality
 */
export function useActivityLogger() {
  const lastEventRef = useRef<{ event: AuthChangeEvent; timestamp: number } | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      try {
        const now = Date.now();
        
        // Prevent duplicate events within 5 seconds
        if (lastEventRef.current && 
            lastEventRef.current.event === event && 
            now - lastEventRef.current.timestamp < 5000) {
          logger.debug(`Auth event ${event} skipped - duplicate within 5s`);
          return;
        }

        lastEventRef.current = { event, timestamp: now };

        // Track session ID to detect actual new logins vs session refreshes
        const currentSessionId = session?.access_token?.substring(0, 10);
        const isNewSession = currentSessionId && currentSessionId !== sessionIdRef.current;
        
        if (currentSessionId) {
          sessionIdRef.current = currentSessionId;
        }

        // Only log specific auth events to avoid duplicates
        if (event === 'SIGNED_IN' && session?.user && isNewSession) {
          // Store a flag in sessionStorage to indicate this is a fresh login
          // This will be checked by the workspace API to determine if login activity should be logged
          sessionStorage.setItem('fresh_login', 'true');
          sessionStorage.setItem('login_timestamp', now.toString());
          logger.debug('Auth event: New user sign-in detected, marked as fresh login');
        } else if (event === 'TOKEN_REFRESHED') {
          logger.debug('Auth event: Token refreshed, not logging as login');
        } else if (event === 'SIGNED_OUT') {
          // Clear session tracking
          sessionIdRef.current = null;
          sessionStorage.removeItem('fresh_login');
          sessionStorage.removeItem('login_timestamp');
          logger.debug('Auth event: User signed out');
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        // Don't throw - this should never break the auth flow
      }
    });

    return () => subscription.unsubscribe();
  }, []);
}

/**
 * Utility function to manually log activity from client-side
 * Use this for client-side actions that don't go through API endpoints
 */
export async function logClientActivity(
  activityType: string,
  description: string,
  metadata?: Record<string, any>
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('Cannot log activity: No active session');
      return;
    }

    // Get user's active workspace
    const { data: memberData } = await supabase
      .from("workspace_members")
      .select("workspace_id, workspaces(name)")
      .eq("user_id", session.user.id)
      .eq("is_active", true)
      .eq("status", "accepted")
      .single();

    if (!memberData) {
      console.warn('Cannot log activity: No active workspace found');
      return;
    }

    // Call the activity logging API
    const response = await fetch('/api/activity-logs/activity-logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logActivity',
        workspace_id: memberData.workspace_id,
        activity_type: activityType,
        activity_description: description,
        metadata: {
          workspace_name: (memberData.workspaces as any)?.name,
          ...metadata,
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to log client activity:', await response.text());
    }
  } catch (error) {
    console.error('Error logging client activity:', error);
    // Don't throw - logging should never break user functionality
  }
}

/**
 * Hook for logging page visits and navigation
 * Use this to track user navigation patterns
 */
export function usePageActivityLogger(pageName: string, metadata?: Record<string, any>) {
  useEffect(() => {
    const logPageVisit = async () => {
      try {
        await logClientActivity(
          'page_visit',
          `User visited ${pageName}`,
          {
            page_name: pageName,
            timestamp: new Date().toISOString(),
            ...metadata,
          }
        );
      } catch (error) {
        console.error('Error logging page visit:', error);
      }
    };

    // Small delay to ensure auth state is settled
    const timer = setTimeout(logPageVisit, 1000);
    
    return () => clearTimeout(timer);
  }, [pageName, metadata]);
}

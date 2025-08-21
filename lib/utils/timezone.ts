/**
 * Timezone utilities for workspace-specific date/time handling
 */

/**
 * Convert a date to a specific timezone
 */
export function convertToTimezone(date: Date | string, timezone: string): Date {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Get the date string in the target timezone
  const tzDate = new Date(dateObj.toLocaleString('en-US', { timeZone: timezone }));
  
  return tzDate;
}

/**
 * Format date in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('en-US', {
    timeZone: timezone,
    ...options
  });
}

/**
 * Get current date/time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): Date {
  return convertToTimezone(new Date(), timezone);
}

/**
 * Format date for display with workspace timezone
 */
export function formatDateForWorkspace(
  date: Date | string,
  timezone: string,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit'
    },
    medium: {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    },
    long: {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    },
    full: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }
  };
  
  return formatInTimezone(dateObj, timezone, formatOptions[format]);
}

/**
 * Get timezone offset in hours
 */
export function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
}

/**
 * Convert local time to UTC for storage
 */
export function convertToUTC(localDate: Date | string, timezone: string): Date {
  const dateObj = typeof localDate === 'string' ? new Date(localDate) : localDate;
  const offset = getTimezoneOffset(timezone);
  
  return new Date(dateObj.getTime() - (offset * 60 * 60 * 1000));
}

/**
 * Get relative time string in workspace timezone
 */
export function getRelativeTimeInTimezone(
  date: Date | string,
  timezone: string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getCurrentTimeInTimezone(timezone);
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Format time range in workspace timezone
 */
export function formatTimeRange(
  startDate: Date | string,
  endDate: Date | string,
  timezone: string
): string {
  const start = formatInTimezone(startDate, timezone, {
    hour: 'numeric',
    minute: '2-digit'
  });
  
  const end = formatInTimezone(endDate, timezone, {
    hour: 'numeric',
    minute: '2-digit'
  });
  
  return `${start} - ${end}`;
}

/**
 * Get business hours in workspace timezone
 */
export function getBusinessHours(timezone: string): {
  start: string;
  end: string;
  isBusinessHours: boolean;
} {
  const now = getCurrentTimeInTimezone(timezone);
  const hours = now.getHours();
  
  return {
    start: '9:00 AM',
    end: '6:00 PM',
    isBusinessHours: hours >= 9 && hours < 18
  };
}

/**
 * Schedule a task for a specific time in workspace timezone
 */
export function getScheduledTimeUTC(
  scheduledTime: string, // Format: "HH:MM"
  timezone: string,
  date: Date = new Date()
): Date {
  const [hours, minutes] = scheduledTime.split(':').map(Number);
  
  // Create date in workspace timezone
  const tzDate = new Date(
    formatInTimezone(date, timezone, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  );
  
  tzDate.setHours(hours, minutes, 0, 0);
  
  // Convert to UTC
  return convertToUTC(tzDate, timezone);
}
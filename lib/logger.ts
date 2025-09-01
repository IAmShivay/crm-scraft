/**
 * Production-safe logging utility
 * Automatically disables debug logs in production builds
 */

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Production-safe logging methods
  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  // Error logging is always enabled for production debugging
  error(...args: any[]): void {
    console.error(...args);
  }

  // Performance timing methods
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // Grouping methods
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  // Table method
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  // Create a child logger with specific context
  child(context: string): Logger {
    const childLogger = new Logger();
    const originalMethods = ['log', 'info', 'debug', 'warn', 'error'];
    
    originalMethods.forEach(method => {
      const originalMethod = (childLogger as any)[method];
      (childLogger as any)[method] = (...args: any[]) => {
        originalMethod.call(childLogger, `[${context}]`, ...args);
      };
    });

    return childLogger;
  }
}

// Create and export the main logger instance
export const logger = new Logger();

// Override console methods in production to prevent accidental logging
if (process.env.NODE_ENV === 'production') {
  // Keep console.error for critical errors
  const originalError = console.error;
  
  // Disable other console methods
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  
  // Restore console.error
  console.error = originalError;
}

export default Logger;

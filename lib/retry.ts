/**
 * Robust retry mechanism with exponential backoff and jitter
 */

import { logger } from "./logger";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any, delay: number) => void;
  onMaxAttemptsReached?: (error: any, attempts: number) => void;
}

export class RetryManager {
  private _defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryCondition: () => true,
    onRetry: () => {},
    onMaxAttemptsReached: () => {},
  };

  get defaultOptions(): Required<RetryOptions> {
    return this._defaultOptions;
  }

  setDefaultOptions(options: Partial<RetryOptions>): void {
    this._defaultOptions = { ...this._defaultOptions, ...options };
  }

  /**
   * Generic retry function with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const finalOptions = { ...this.defaultOptions, ...options };
    let lastError: any;
    let delay = finalOptions.baseDelay;

    for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Check if we should retry
        if (!finalOptions.retryCondition(error) || attempt === finalOptions.maxAttempts) {
          if (attempt === finalOptions.maxAttempts && finalOptions.onMaxAttemptsReached) {
            finalOptions.onMaxAttemptsReached(error, attempt);
          }
          throw error;
        }

        // Call onRetry callback
        if (finalOptions.onRetry) {
          finalOptions.onRetry(attempt, error, delay);
        }

        // Wait before retrying
        await this.delay(delay);

        // Calculate next delay with exponential backoff
        delay = Math.min(
          delay * finalOptions.backoffMultiplier,
          finalOptions.maxDelay
        );

        // Add jitter if enabled
        if (finalOptions.jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }
      }
    }

    throw lastError;
  }

  /**
   * Specialized retry for API calls with common error handling
   */
  async retryApiCall<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const apiRetryOptions: RetryOptions = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitter: true,
      retryCondition: (error: any) => {
        // Retry on network errors, 5xx server errors, and rate limits
        return (
          error.name === 'NetworkError' ||
          error.code === 'NETWORK_ERROR' ||
          (error.status >= 500 && error.status < 600) ||
          error.status === 429 ||
          error.message?.includes('timeout') ||
          error.message?.includes('network')
        );
      },
      onRetry: (attempt, error, delay) => {
        logger.warn(`API call failed, retrying in ${delay}ms (attempt ${attempt}):`, error);
      },
      onMaxAttemptsReached: (error, attempts) => {
        logger.error(`API call failed after ${attempts} attempts:`, error);
      },
      ...options,
    };

    return this.retry(operation, apiRetryOptions);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-configured retry instances
export const quickRetry = new RetryManager();
export const persistentRetry = new RetryManager();
export const apiRetry = new RetryManager();

// Configure persistent retry for long-running operations
persistentRetry.setDefaultOptions({
  maxAttempts: 10,
  baseDelay: 2000,
  maxDelay: 60000,
});

// Configure API retry for common API operations
apiRetry.setDefaultOptions({
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
});

export default RetryManager;

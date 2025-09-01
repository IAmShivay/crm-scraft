# 🚀 **Error Boundaries & Retry Mechanisms - Complete Usage Guide**

## **📋 Table of Contents**
1. [Overview](#overview)
2. [Error Boundaries](#error-boundaries)
3. [Retry Mechanisms](#retry-mechanisms)
4. [Production-Safe Logging](#production-safe-logging)
5. [Integration Examples](#integration-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## **🎯 Overview**

This guide explains how to implement **Error Boundaries** and **Retry Mechanisms** in your CRM application to create a robust, user-friendly experience that gracefully handles failures and automatically retries failed operations.

### **What You'll Learn:**
- ✅ How to wrap components with Error Boundaries
- ✅ How to implement intelligent retry logic
- ✅ How to use production-safe logging
- ✅ Real-world integration examples
- ✅ Best practices for error handling

---

## **🛡️ Error Boundaries**

### **What Are Error Boundaries?**

Error Boundaries are React components that catch JavaScript errors anywhere in their child component tree and display a fallback UI instead of crashing the entire application.

### **Key Features:**
- **Automatic Error Catching**: Catches errors in child components
- **Graceful Fallback UI**: Shows user-friendly error messages
- **Retry Mechanisms**: Built-in retry functionality
- **Development Debugging**: Shows error details in development mode
- **Navigation Recovery**: Option to go back to dashboard

### **Basic Usage:**

```tsx
import ErrorBoundary from "@/components/error/ErrorBoundary";

function MyComponent() {
  return (
    <ErrorBoundary
      maxRetries={3}
      onError={(error, errorInfo) => {
        // Custom error handling
        console.error('Component error:', error);
      }}
    >
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### **Advanced Usage:**

```tsx
<ErrorBoundary
  maxRetries={5}
  maxRetries={3}
  onError={(error, errorInfo) => {
    // Log to external service
    logErrorToService(error, errorInfo);
    
    // Send analytics
    analytics.track('error_boundary_triggered', {
      component: 'Dashboard',
      error: error.message
    });
  }}
  fallback={
    <CustomErrorUI 
      title="Dashboard Error"
      message="We're having trouble loading your dashboard"
    />
  }
>
  <DashboardContent />
</ErrorBoundary>
```

### **Error Boundary Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | Required | Components to wrap |
| `maxRetries` | number | 3 | Maximum retry attempts |
| `onError` | function | undefined | Custom error handler |
| `fallback` | ReactNode | undefined | Custom error UI |
| `className` | string | '' | Additional CSS classes |

---

## **🔄 Retry Mechanisms**

### **What Are Retry Mechanisms?**

Retry mechanisms automatically retry failed operations with intelligent backoff strategies, improving reliability and user experience.

### **Key Features:**
- **Exponential Backoff**: Smart delay between retries
- **Jitter**: Prevents thundering herd problems
- **Configurable Conditions**: Define when to retry
- **API-Specific Logic**: Specialized for network requests
- **Progress Tracking**: Monitor retry attempts

### **Basic Usage:**

```tsx
import { retry, retryApiCall } from "@/lib/retry";

// Simple retry
const result = await retry(async () => {
  return await fetchData();
});

// API-specific retry
const result = await retryApiCall(async () => {
  return await api.get('/users');
});
```

### **Advanced Usage:**

```tsx
import { retryManager, quickRetry, persistentRetry } from "@/lib/retry";

// Custom retry configuration
const result = await retryManager.retry(
  async () => await saveUserData(user),
  {
    maxAttempts: 5,
    baseDelay: 2000,
    backoffMultiplier: 2.5,
    retryCondition: (error, attempt) => {
      // Only retry on network errors
      return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
    },
    onRetry: (error, attempt, delay) => {
      console.log(`Retry ${attempt} after ${delay}ms`);
    },
    onMaxAttemptsReached: (error, attempts) => {
      console.log(`Failed after ${attempts} attempts`);
    }
  }
);

// Pre-configured retry managers
const quickResult = await quickRetry(async () => await quickOperation());
const persistentResult = await persistentRetry(async () => await criticalOperation());
```

### **Retry Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxAttempts` | number | 3 | Maximum retry attempts |
| `baseDelay` | number | 1000 | Base delay in milliseconds |
| `maxDelay` | number | 30000 | Maximum delay cap |
| `backoffMultiplier` | number | 2 | Exponential backoff multiplier |
| `jitter` | boolean | true | Add randomness to delays |
| `retryCondition` | function | () => true | Custom retry logic |
| `onRetry` | function | undefined | Retry callback |
| `onMaxAttemptsReached` | function | undefined | Max attempts callback |

---

## **📝 Production-Safe Logging**

### **What Is Production-Safe Logging?**

A logging system that automatically prevents accidental console logging in production builds while maintaining debugging capabilities in development.

### **Key Features:**
- **Environment-Aware**: Different behavior in dev vs production
- **Structured Logging**: Consistent log format with timestamps
- **Level-Based**: Different log levels (error, warn, info, debug)
- **Console Override**: Prevents accidental production logging
- **Child Loggers**: Create specialized logger instances

### **Basic Usage:**

```tsx
import logger from "@/lib/logger";

// Different log levels
logger.error("Critical error occurred");
logger.warn("Warning message");
logger.info("Information message");
logger.debug("Debug information"); // Only in development
logger.log("General log message"); // Only in development

// Performance timing
logger.time("API Call");
const result = await apiCall();
logger.timeEnd("API Call");

// Grouped logging
logger.group("User Authentication", () => {
  logger.info("Starting authentication");
  logger.debug("User credentials received");
  logger.info("Authentication successful");
});
```

### **Advanced Usage:**

```tsx
import { logger } from "@/lib/logger";

// Create child loggers
const apiLogger = logger.child("API");
const authLogger = logger.child("Auth");
const dashboardLogger = logger.child("Dashboard");

// Use in different contexts
apiLogger.info("Making API request to /users");
authLogger.warn("Token expired, refreshing...");
dashboardLogger.debug("Dashboard data loaded");

// Custom logger configuration
const customLogger = new Logger({
  prefix: "[Custom]",
  enableConsole: true, // Force enable even in production
});
```

### **Log Levels:**

| Level | Development | Production | Use Case |
|-------|-------------|------------|----------|
| `error` | ✅ | ✅ | Critical errors, always logged |
| `warn` | ✅ | ✅ | Warnings, important issues |
| `info` | ✅ | ✅ | General information |
| `debug` | ✅ | ❌ | Debug information |
| `log` | ✅ | ❌ | General logging |

---

## **🔧 Integration Examples**

### **1. Dashboard Component with Error Boundary:**

```tsx
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { retryApiCall } from "@/lib/retry";
import logger from "@/lib/logger";

const DashboardClient = React.memo(() => {
  // ... component logic

  return (
    <ErrorBoundary
      maxRetries={3}
      onError={(error, errorInfo) => {
        logger.error('Dashboard error:', error.message, errorInfo);
        // Send to error tracking service
        trackError(error, errorInfo);
      }}
    >
      <div className="dashboard-content">
        {/* Your dashboard content */}
      </div>
    </ErrorBoundary>
  );
});
```

### **2. API Calls with Retry Logic:**

```tsx
import { retryApiCall, quickRetry } from "@/lib/retry";
import logger from "@/lib/logger";

const fetchUserData = async (userId: string) => {
  return await retryApiCall(
    async () => {
      logger.info(`Fetching user data for ID: ${userId}`);
      const response = await api.get(`/users/${userId}`);
      logger.debug("User data received:", response.data);
      return response.data;
    },
    {
      maxAttempts: 3,
      statusCodes: [408, 429, 500, 502, 503, 504],
      onRetry: (error, attempt, delay) => {
        logger.warn(`Retry ${attempt} for user ${userId} after ${delay}ms`);
      }
    }
  );
};
```

### **3. Form Submission with Retry:**

```tsx
import { retry } from "@/lib/retry";
import logger from "@/lib/logger";

const handleSubmit = async (formData: FormData) => {
  try {
    const result = await retry(
      async () => {
        logger.info("Submitting form data");
        const response = await submitForm(formData);
        logger.info("Form submitted successfully");
        return response;
      },
      {
        maxAttempts: 2,
        baseDelay: 1000,
        retryCondition: (error) => {
          // Only retry on network errors
          return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
        }
      }
    );
    
    toast.success("Form submitted successfully!");
  } catch (error) {
    logger.error("Form submission failed after retries:", error);
    toast.error("Failed to submit form. Please try again.");
  }
};
```

### **4. Component-Level Error Handling:**

```tsx
import ErrorBoundary from "@/components/error/ErrorBoundary";

const UserProfile = () => {
  return (
    <ErrorBoundary
      fallback={
        <div className="error-fallback">
          <h3>Profile Loading Error</h3>
          <p>We couldn't load your profile. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      }
    >
      <ProfileContent />
    </ErrorBoundary>
  );
};
```

---

## **⭐ Best Practices**

### **Error Boundaries:**
1. **Wrap at Appropriate Levels**: Don't wrap every component, wrap logical sections
2. **Custom Fallback UI**: Provide helpful error messages and recovery options
3. **Error Logging**: Always log errors for debugging and monitoring
4. **User Experience**: Keep users informed and provide recovery paths

### **Retry Mechanisms:**
1. **Exponential Backoff**: Use exponential backoff to prevent overwhelming servers
2. **Jitter**: Add randomness to prevent thundering herd problems
3. **Retry Conditions**: Only retry on transient errors, not permanent failures
4. **User Feedback**: Show retry progress to users
5. **Circuit Breaker**: Consider implementing circuit breaker pattern for critical services

### **Logging:**
1. **Structured Logging**: Use consistent log format and levels
2. **Context Information**: Include relevant context in log messages
3. **Performance Monitoring**: Use timing logs for performance tracking
4. **Production Safety**: Never log sensitive information
5. **External Services**: Integrate with external logging services for production

### **General:**
1. **Graceful Degradation**: Provide fallback functionality when possible
2. **User Communication**: Keep users informed about what's happening
3. **Monitoring**: Track error rates and retry success rates
4. **Testing**: Test error scenarios and retry logic
5. **Documentation**: Document error handling strategies for your team

---

## **🔍 Troubleshooting**

### **Common Issues:**

#### **1. Error Boundary Not Catching Errors:**
- Ensure Error Boundary is a class component
- Check that errors are thrown in child components, not in event handlers
- Verify Error Boundary is properly wrapping the target components

#### **2. Retry Mechanism Not Working:**
- Check retry conditions are properly configured
- Verify error types match retry conditions
- Ensure maxAttempts is greater than 1

#### **3. Logging Not Working in Production:**
- Verify NODE_ENV is set to 'production'
- Check that logger is properly imported
- Ensure console methods are not overridden elsewhere

#### **4. Performance Issues:**
- Monitor retry delays and adjust baseDelay
- Use appropriate maxAttempts for different operations
- Consider using quickRetry for non-critical operations

### **Debug Tips:**

```tsx
// Enable detailed logging in development
if (process.env.NODE_ENV === 'development') {
  logger.debug("Debug information");
  logger.time("Operation timing");
  // ... operation
  logger.timeEnd("Operation timing");
}

// Check retry configuration
console.log("Retry options:", retryOptions);

// Monitor error boundary state
console.log("Error boundary state:", errorBoundaryState);
```

---

## **📚 Additional Resources**

### **Related Documentation:**
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

### **Advanced Topics:**
- **Circuit Breaker Pattern**: Prevent cascading failures
- **Dead Letter Queues**: Handle permanently failed operations
- **Distributed Tracing**: Track requests across services
- **Metrics and Monitoring**: Track error rates and performance

---

## **🎉 Conclusion**

By implementing Error Boundaries and Retry Mechanisms, you've significantly improved your CRM application's reliability and user experience. These patterns provide:

- **Better User Experience**: Graceful error handling and automatic retries
- **Improved Reliability**: Automatic recovery from transient failures
- **Better Debugging**: Structured logging and error tracking
- **Production Safety**: Prevents accidental logging and provides fallbacks

Remember to:
1. **Start Simple**: Begin with basic error boundaries and retry logic
2. **Iterate**: Gradually add more sophisticated error handling
3. **Monitor**: Track error rates and retry success rates
4. **Test**: Regularly test error scenarios and recovery paths

Your CRM application is now more robust and user-friendly! 🚀

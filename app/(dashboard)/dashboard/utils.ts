/**
 * Dashboard utility functions
 */

/**
 * Format numbers to human-readable format
 * Examples:
 * 1000 → 1k
 * 1500 → 1.5k
 * 1000000 → 1M
 * 1500000 → 1.5M
 * 1000000000 → 1B
 */
export function formatAmount(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) return '0';
  
  // Handle negative numbers
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  
  let formatted: string;
  
  if (absNum >= 1000000000) {
    // Billions
    formatted = (absNum / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (absNum >= 1000000) {
    // Millions
    formatted = (absNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absNum >= 1000) {
    // Thousands
    formatted = (absNum / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    // Less than 1000
    formatted = absNum.toString();
  }
  
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format currency amounts with proper symbols
 * Examples:
 * 1000 → ₹1k
 * 1500000 → ₹1.5M
 */
export function formatCurrency(amount: number | string, currencySymbol: string = '₹'): string {
  const formattedAmount = formatAmount(amount);
  return `${currencySymbol}${formattedAmount}`;
}

/**
 * Format percentage values
 * Examples:
 * 0.1234 → 12.3%
 * 0.05 → 5%
 */
export function formatPercentage(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0%';
  
  // If the number is already a percentage (> 1), use as is
  // If it's a decimal (< 1), multiply by 100
  const percentage = num > 1 ? num : num * 100;
  
  return `${percentage.toFixed(1).replace(/\.0$/, '')}%`;
}

/**
 * Format large numbers with commas for readability
 * Examples:
 * 1000 → 1,000
 * 1000000 → 1,000,000
 */
export function formatNumberWithCommas(num: number | string): string {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(number)) return '0';
  
  return number.toLocaleString();
}

/**
 * Get appropriate color class for percentage changes
 */
export function getChangeColorClass(change: string | number): string {
  const changeStr = typeof change === 'number' ? change.toString() : change;
  
  if (changeStr.startsWith('+')) {
    return 'text-green-500';
  } else if (changeStr.startsWith('-')) {
    return 'text-red-500';
  }
  
  return 'text-muted-foreground';
}

/**
 * Parse change string and return formatted version
 * Examples:
 * "+12.5%" → "+12.5%"
 * "12.5" → "+12.5%"
 * "-5.2%" → "-5.2%"
 */
export function formatChange(change: string | number): string {
  if (typeof change === 'number') {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change}%`;
  }
  
  const changeStr = change.toString();
  
  // If it already has % and +/-, return as is
  if (changeStr.includes('%') && (changeStr.includes('+') || changeStr.includes('-'))) {
    return changeStr;
  }
  
  // If it has % but no sign, add + for positive
  if (changeStr.includes('%')) {
    const num = parseFloat(changeStr.replace('%', ''));
    const sign = num >= 0 ? '+' : '';
    return `${sign}${changeStr}`;
  }
  
  // If it's just a number, add % and sign
  const num = parseFloat(changeStr);
  if (!isNaN(num)) {
    const sign = num >= 0 ? '+' : '';
    return `${sign}${num}%`;
  }
  
  return changeStr;
}

/**
 * Format date to readable string
 * Examples:
 * new Date() → "Dec 25, 2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid Date';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format date and time to readable string
 * Examples:
 * new Date() → "Dec 25, 2024 at 3:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return 'Invalid Date';

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time string
 * Examples:
 * "2 minutes ago", "1 hour ago", "3 days ago"
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Truncate text with ellipsis
 * Examples:
 * truncateText("Hello World", 5) → "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitalize first letter of each word
 * Examples:
 * capitalizeWords("hello world") → "Hello World"
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Generate initials from name
 * Examples:
 * getInitials("John Doe") → "JD"
 * getInitials("John") → "J"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
}

/**
 * Validate email address
 * Examples:
 * validateEmail("test@example.com") → true
 * validateEmail("invalid-email") → false
 */
export function validateEmail(email: string): boolean {
  return Boolean(email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));
}

/**
 * Validate phone number (basic validation)
 * Examples:
 * validatePhone("+1234567890") → true
 * validatePhone("123") → false
 */
export function validatePhone(phone: string): boolean {
  return Boolean(phone.match(/^\+?[1-9]\d{9,14}$/));
}

/**
 * Validate password strength
 * Examples:
 * validatePassword("password123") → true
 * validatePassword("123") → false
 */
export function validatePassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Generate random ID
 */
export function generateId(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

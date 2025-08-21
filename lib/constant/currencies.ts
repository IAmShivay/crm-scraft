/**
 * Currency configuration for workspaces
 */

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  decimal_digits: number;
  locale?: string;
}

export const CURRENCIES: Record<string, Currency> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimal_digits: 2,
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimal_digits: 2,
    locale: 'de-DE'
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimal_digits: 2,
    locale: 'en-GB'
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimal_digits: 2,
    locale: 'en-IN'
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimal_digits: 0,
    locale: 'ja-JP'
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimal_digits: 2,
    locale: 'zh-CN'
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    decimal_digits: 2,
    locale: 'en-AU'
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    decimal_digits: 2,
    locale: 'en-CA'
  },
  CHF: {
    code: 'CHF',
    symbol: 'Fr',
    name: 'Swiss Franc',
    decimal_digits: 2,
    locale: 'de-CH'
  },
  HKD: {
    code: 'HKD',
    symbol: 'HK$',
    name: 'Hong Kong Dollar',
    decimal_digits: 2,
    locale: 'zh-HK'
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    decimal_digits: 2,
    locale: 'en-SG'
  },
  SEK: {
    code: 'SEK',
    symbol: 'kr',
    name: 'Swedish Krona',
    decimal_digits: 2,
    locale: 'sv-SE'
  },
  NOK: {
    code: 'NOK',
    symbol: 'kr',
    name: 'Norwegian Krone',
    decimal_digits: 2,
    locale: 'nb-NO'
  },
  NZD: {
    code: 'NZD',
    symbol: 'NZ$',
    name: 'New Zealand Dollar',
    decimal_digits: 2,
    locale: 'en-NZ'
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Mexican Peso',
    decimal_digits: 2,
    locale: 'es-MX'
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    decimal_digits: 2,
    locale: 'en-ZA'
  },
  BRL: {
    code: 'BRL',
    symbol: 'R$',
    name: 'Brazilian Real',
    decimal_digits: 2,
    locale: 'pt-BR'
  },
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    decimal_digits: 2,
    locale: 'ru-RU'
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    decimal_digits: 0,
    locale: 'ko-KR'
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    decimal_digits: 2,
    locale: 'ar-AE'
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    decimal_digits: 2,
    locale: 'ar-SA'
  },
  THB: {
    code: 'THB',
    symbol: '฿',
    name: 'Thai Baht',
    decimal_digits: 2,
    locale: 'th-TH'
  },
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    decimal_digits: 0,
    locale: 'id-ID'
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    name: 'Malaysian Ringgit',
    decimal_digits: 2,
    locale: 'ms-MY'
  },
  PHP: {
    code: 'PHP',
    symbol: '₱',
    name: 'Philippine Peso',
    decimal_digits: 2,
    locale: 'en-PH'
  }
};

/**
 * Get currency by code
 */
export function getCurrency(code: string): Currency | undefined {
  return CURRENCIES[code];
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol || code;
}

/**
 * Format amount with currency
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  options?: Intl.NumberFormatOptions
): string {
  const currency = getCurrency(currencyCode);
  if (!currency) {
    return `${currencyCode} ${amount}`;
  }

  try {
    return new Intl.NumberFormat(currency.locale || 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currency.decimal_digits,
      maximumFractionDigits: currency.decimal_digits,
      ...options
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currency.symbol}${amount.toFixed(currency.decimal_digits)}`;
  }
}

/**
 * Get list of currencies for dropdown
 */
export function getCurrencyList(): Array<{ value: string; label: string; symbol: string }> {
  return Object.values(CURRENCIES).map(currency => ({
    value: currency.code,
    label: `${currency.name} (${currency.symbol})`,
    symbol: currency.symbol
  }));
}

/**
 * Default currency code
 */
export const DEFAULT_CURRENCY = 'INR';
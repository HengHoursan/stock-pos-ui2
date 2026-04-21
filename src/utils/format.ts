/**
 * Formats a date string or Date object into a readable date-time string.
 * Example: 03/04/2026 16:15
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(date));
  } catch (e) {
    return "-";
  }
}

/**
 * Formats a date into a localized long format.
 * Example: Friday, April 3, 2026, 4:15:20 PM
 */
export function formatFullDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  try {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'medium'
    }).format(new Date(date));
  } catch (e) {
    return "-";
  }
}

/**
 * Formats a date for filenames (YYYY-MM-DD_HH-mm)
 */
export function formatDateForFilename(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}_${HH}-${mm}`;
}

import { useCurrencyStore } from "@/stores/currency";

/**
 * Formats a number as a currency string using the active system currency.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  let currencyStore;
  try {
    currencyStore = useCurrencyStore();
  } catch (e) {
    // Fallback if accessed outside of Pinia context
  }

  const symbol = currencyStore?.activeCurrency?.symbol ?? '$';
  const rate = currencyStore?.activeCurrency?.exchangeRate ?? 1;
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Convert value based on exchange rate
  const convertedValue = (value || 0) * rate;

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedValue);

  return `${symbol}${formatted}`;
}

/**
 * Converts a Date object to a local ISO string (YYYY-MM-DDTHH:mm) suitable for input[type="datetime-local"].
 */
export function toLocalISOString(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

/**
 * Formats an exchange rate naturally (no trailing zeros, up to 4 decimals).
 */
export function formatRate(rate: number | string | null | undefined): string {
  const value = Number(rate || 0);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value);
}

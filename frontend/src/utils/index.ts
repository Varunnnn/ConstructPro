import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes user input string by stripping HTML tags, script elements,
 * javascript: links, and unsafe characters to prevent XSS / script injection attacks.
 */
export function sanitizeInput(str: string): string {
  if (!str) return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// ── Currency formatting ────────────────────────────────────────────────────

export type CurrencyCode = 'USD' | 'INR';

export function getSelectedCurrency(): CurrencyCode {
  return (localStorage.getItem('constructpro_currency') as CurrencyCode) || 'USD';
}

export function setSelectedCurrency(currency: CurrencyCode): void {
  localStorage.setItem('constructpro_currency', currency);
  window.dispatchEvent(new Event('currency-change'));
}

/**
 * Format a number dynamically based on selected currency (USD / INR).
 */
export function formatRupees(value: string | number | null | undefined, compact = false): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const currency = getSelectedCurrency();
  
  if (isNaN(num)) return currency === 'USD' ? '$0' : '₹0';

  if (currency === 'USD') {
    if (compact && Math.abs(num) >= 1000) {
      if (Math.abs(num) >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
      if (Math.abs(num) >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(num);
  }

  if (compact && Math.abs(num) >= 100000) {
    if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(num);
}

export function parseRupees(value: string | number | null | undefined): number {
  const str = String(value ?? '0').replace(/[$₹,\s]/g, '');
  return parseFloat(str) || 0;
}

// ── Date formatting ────────────────────────────────────────────────────────

/**
 * Format date as Indian format: 24 Aug 2026
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function toInputDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
}

export function todayInputDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ── Status helpers ─────────────────────────────────────────────────────────

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PROJECT_STATUS_CLASSES: Record<string, string> = {
  planning: 'badge-planning',
  active: 'badge-active',
  on_hold: 'badge-on-hold',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
};

export const WORKER_TYPE_LABELS: Record<string, string> = {
  mason: 'Mason',
  helper: 'Helper',
  carpenter: 'Carpenter',
  electrician: 'Electrician',
  plumber: 'Plumber',
  painter: 'Painter',
  other: 'Other',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  fuel: 'Fuel',
  electricity: 'Electricity',
  tools: 'Tools',
  food: 'Food',
  equipment: 'Equipment',
  labour_advance: 'Labour Advance',
  miscellaneous: 'Miscellaneous',
};

export const MATERIAL_CATEGORY_LABELS: Record<string, string> = {
  cement: 'Cement',
  steel: 'Steel',
  sand: 'Sand',
  bricks: 'Bricks',
  stone: 'Stone',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  paint: 'Paint',
  hardware: 'Hardware',
  other: 'Other',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other',
};

export const ENTITY_TYPE_ICONS: Record<string, string> = {
  project: '🏗️',
  worker: '👷',
  attendance: '📋',
  expense: '💸',
  material: '🧱',
  payment: '💰',
};

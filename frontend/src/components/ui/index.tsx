import { cn } from '../../utils';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  color?: 'default' | 'green' | 'red' | 'orange' | 'blue';
  icon?: React.ReactNode;
}

export function StatCard({ label, value, sub, color = 'default', icon }: StatCardProps) {
  const colorMap = {
    default: 'bg-white',
    green: 'bg-green-50 border-green-100',
    red: 'bg-red-50 border-red-100',
    orange: 'bg-orange-50 border-orange-100',
    blue: 'bg-blue-50 border-blue-100',
  };
  const valueColorMap = {
    default: 'text-surface-900',
    green: 'text-green-700',
    red: 'text-red-600',
    orange: 'text-orange-700',
    blue: 'text-blue-700',
  };

  return (
    <div className={cn('card p-4 lg:p-5', colorMap[color])}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="fin-label mb-1 truncate">{label}</p>
          <p className={cn('text-lg sm:text-xl lg:text-2xl font-bold tracking-tight truncate', valueColorMap[color])} title={value}>{value}</p>
          {sub && <p className="text-xs text-surface-400 mt-1 truncate">{sub}</p>}
        </div>
        {icon && <div className="flex-shrink-0 opacity-70 mt-1">{icon}</div>}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="text-base font-semibold text-surface-900 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', className)}>
      <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
      <span>⚠️</span>
      <span>{message || 'Something went wrong. Please try again.'}</span>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = 'Confirm', danger = false }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-modal">
        <h3 className="text-base font-bold text-surface-900 mb-2">{title}</h3>
        <p className="text-sm text-surface-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} className={danger ? 'btn-danger flex-1' : 'btn-primary flex-1'}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Badge({ status }: { status: string }) {
  const classMap: Record<string, string> = {
    active: 'badge-active',
    planning: 'badge-planning',
    on_hold: 'badge-on-hold',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    present: 'badge-present',
    half_day: 'badge-half-day',
    absent: 'badge-absent',
    paid: 'badge bg-green-100 text-green-700',
    pending: 'badge bg-yellow-100 text-yellow-700',
    partial: 'badge bg-orange-100 text-orange-700',
  };
  const labelMap: Record<string, string> = {
    active: 'Active', planning: 'Planning', on_hold: 'On Hold',
    completed: 'Completed', cancelled: 'Cancelled',
    present: 'Present', half_day: 'Half Day', absent: 'Absent',
    paid: 'Paid', pending: 'Pending', partial: 'Partial',
    mason: 'Mason', helper: 'Helper', carpenter: 'Carpenter',
    electrician: 'Electrician', plumber: 'Plumber', painter: 'Painter', other: 'Other',
  };
  return (
    <span className={classMap[status] || 'badge bg-surface-100 text-surface-600'}>
      {labelMap[status] || status}
    </span>
  );
}

export { default as TrialBanner } from './TrialBanner';
export { default as UpgradeLimitModal } from './UpgradeLimitModal';

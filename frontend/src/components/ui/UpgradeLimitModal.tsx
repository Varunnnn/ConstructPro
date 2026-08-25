import { useNavigate } from 'react-router-dom';
import { Zap, Lock, X } from 'lucide-react';

interface UpgradeLimitModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  recommendedPlan?: string;
  errorCode?: string;
}

const PLAN_DESCRIPTIONS: Record<string, { label: string; price: string; color: string }> = {
  STARTER: { label: 'Starter', price: '₹999/mo', color: 'text-blue-600' },
  PROFESSIONAL: { label: 'Professional', price: '₹1,999/mo', color: 'text-brand-600' },
  BUSINESS: { label: 'Business', price: '₹3,999/mo', color: 'text-purple-600' },
  ENTERPRISE: { label: 'Enterprise', price: 'Custom', color: 'text-gray-800' },
};

export default function UpgradeLimitModal({
  open,
  onClose,
  title,
  message,
  recommendedPlan = 'PROFESSIONAL',
  errorCode,
}: UpgradeLimitModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const rec = PLAN_DESCRIPTIONS[recommendedPlan] || PLAN_DESCRIPTIONS.PROFESSIONAL;

  const defaultTitle =
    errorCode === 'PROJECT_LIMIT_REACHED'
      ? 'Project Limit Reached'
      : errorCode === 'WORKER_LIMIT_REACHED'
      ? 'Worker Limit Reached'
      : errorCode === 'USER_LIMIT_REACHED'
      ? 'Team Member Limit Reached'
      : errorCode === 'SUBSCRIPTION_EXPIRED'
      ? 'Subscription Expired'
      : 'Upgrade Required';

  const defaultMessage =
    errorCode === 'PROJECT_LIMIT_REACHED'
      ? "You've reached the maximum number of active projects on your current plan."
      : errorCode === 'WORKER_LIMIT_REACHED'
      ? "You've reached the maximum number of active workers on your current plan."
      : errorCode === 'USER_LIMIT_REACHED'
      ? "You've reached the team member limit on your current plan."
      : errorCode === 'SUBSCRIPTION_EXPIRED'
      ? 'Your subscription has expired. Upgrade now to continue managing your projects.'
      : 'Your current plan does not include this feature.';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-extrabold">{title || defaultTitle}</h2>
          <p className="text-brand-100 text-sm mt-1">Upgrade your plan to unlock this</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-surface-600 text-center">
            {message || defaultMessage}
          </p>

          {/* Recommended plan highlight */}
          <div className="bg-brand-50 border-2 border-brand-200 rounded-xl p-4 text-center">
            <p className="text-xs text-surface-500 uppercase tracking-wide font-semibold mb-1">Recommended</p>
            <p className={`text-xl font-extrabold ${rec.color}`}>{rec.label} Plan</p>
            <p className="text-sm text-surface-600 mt-0.5">Starting at <span className="font-bold">{rec.price}</span></p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-2.5 pt-1">
            <button
              onClick={() => { navigate('/pricing'); onClose(); }}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              <Zap className="w-4 h-4" />
              View All Plans & Upgrade
            </button>
            <button
              onClick={onClose}
              className="w-full text-surface-500 hover:text-surface-700 text-sm py-2 font-medium transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white p-1.5 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Zap, X, Clock, AlertTriangle } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { useState } from 'react';

export default function TrialBanner() {
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (!subscription || dismissed) return null;

  const { status, trial_days_remaining, cancel_at_period_end, plan } = subscription;

  // Nothing to show for active paid plans (unless cancellation is scheduled)
  if (status === 'ACTIVE' && !cancel_at_period_end) return null;

  // Determine banner style & message
  let bgColor = 'bg-amber-500';
  let icon = <Clock className="w-4 h-4 flex-shrink-0" />;
  let message = '';
  let urgentStyle = false;

  if (status === 'TRIALING') {
    if (trial_days_remaining <= 3) {
      bgColor = 'bg-red-600';
      icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
      urgentStyle = true;
    }
    message =
      trial_days_remaining <= 0
        ? 'Your free trial has ended. Upgrade now to continue using ConstructPro.'
        : trial_days_remaining === 1
        ? '⚠️ Your free trial ends TOMORROW! Upgrade now to avoid losing access.'
        : `${trial_days_remaining} days left in your free trial. Upgrade before it ends.`;
  } else if (status === 'EXPIRED') {
    bgColor = 'bg-red-700';
    icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    urgentStyle = true;
    message = 'Your trial has expired. Upgrade your plan to regain full access.';
  } else if (status === 'PAST_DUE') {
    bgColor = 'bg-orange-600';
    icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />;
    message = 'Your last payment failed. Please update your payment method to avoid service interruption.';
  } else if (status === 'CANCELLED' || cancel_at_period_end) {
    bgColor = 'bg-orange-500';
    message = `Your ${plan.name} subscription will end soon. Reactivate to keep all your data and access.`;
  } else {
    return null;
  }

  return (
    <div className={`${bgColor} text-white text-xs font-semibold py-2.5 px-4 flex items-center justify-between gap-3 w-full z-50`}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <span className={`truncate ${urgentStyle ? 'font-bold' : ''}`}>{message}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => navigate('/pricing')}
          className="flex items-center gap-1.5 bg-white text-amber-900 px-3 py-1 rounded text-xs font-extrabold uppercase hover:bg-amber-50 transition-colors whitespace-nowrap"
        >
          <Zap className="w-3 h-3" />
          Upgrade Now
        </button>
        {status !== 'EXPIRED' && (
          <button
            onClick={() => setDismissed(true)}
            className="text-white/70 hover:text-white p-0.5 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

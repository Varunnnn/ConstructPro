import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, Building2, Globe, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/ui';
import { getSelectedCurrency, setSelectedCurrency, type CurrencyCode } from '../../utils';

export default function SettingsPage() {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();
  const [currency, setCurrencyState] = useState<CurrencyCode>(getSelectedCurrency());

  useEffect(() => {
    const handleCurrencyChange = () => {
      setCurrencyState(getSelectedCurrency());
    };
    window.addEventListener('currency-change', handleCurrencyChange);
    return () => window.removeEventListener('currency-change', handleCurrencyChange);
  }, []);

  const handleCurrencySelect = (newCurrency: CurrencyCode) => {
    setSelectedCurrency(newCurrency);
    setCurrencyState(newCurrency);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader title="Settings" />

      {/* Profile */}
      <div className="card p-5 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{user?.full_name?.[0]?.toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-surface-900">{user?.full_name}</h2>
            <p className="text-sm text-surface-500">{user?.email}</p>
            {user?.mobile && <p className="text-sm text-surface-400">{user?.mobile}</p>}
          </div>
        </div>
      </div>

      {/* Currency Preference (US / Global Target) */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-surface-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-neutral-900" /> Default Portal Currency
            </h3>
            <p className="text-xs text-surface-500 mt-0.5">
              Targeting US &amp; Global construction financial metrics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => handleCurrencySelect('USD')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
              currency === 'USD'
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <DollarSign className="w-4 h-4" /> US Dollar ($ USD)
          </button>
          <button
            onClick={() => handleCurrencySelect('INR')}
            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
              currency === 'INR'
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-md'
                : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            ₹ Indian Rupee (₹ INR)
          </button>
        </div>
      </div>

      {/* Organization */}
      {organization && (
        <div className="card p-5 mb-4">
          <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">Organization</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-neutral-900" />
            </div>
            <div>
              <p className="text-sm font-bold text-surface-900">{organization.name}</p>
              <p className="text-xs text-surface-400">Plan: {organization.plan} · {organization.subscription_status}</p>
            </div>
          </div>
        </div>
      )}

      {/* App info */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">About</h3>
        <div className="space-y-2 text-sm text-surface-600">
          <div className="flex justify-between">
            <span>Version</span>
            <span className="font-medium text-surface-900">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Active Currency</span>
            <span className="font-bold text-surface-900">{currency === 'USD' ? 'US Dollar ($)' : 'Indian Rupee (₹)'}</span>
          </div>
        </div>
      </div>

      <button onClick={handleLogout} className="btn-danger w-full btn-lg">
        <LogOut className="w-5 h-5" /> Log out
      </button>
    </div>
  );
}

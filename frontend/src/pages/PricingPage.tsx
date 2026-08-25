import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, Gift, Zap, Clock, Building2 } from 'lucide-react';
import { billingApi } from '../api/client';
import { LoadingSpinner } from '../components/ui';
import { formatRupees } from '../utils';

export default function PricingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => (await billingApi.getPlans()).data,
  });

  const plans = (plansData?.data || []).filter((p: any) => p.code !== 'FREE_TRIAL');

  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any>(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSelectPlan = (plan: any) => {
    if (plan.code === 'ENTERPRISE') {
      window.location.href = 'mailto:sales@constructpro.in?subject=Enterprise%20Inquiry';
      return;
    }
    setSelectedPlanForModal(plan);
    setUtrNumber('');
  };

  const handleConfirmUPIPayment = async () => {
    if (!selectedPlanForModal) return;
    setIsVerifying(true);
    try {
      const checkoutRes = await billingApi.createCheckout({
        plan_code: selectedPlanForModal.code,
        billing_cycle: billingCycle,
      });
      const orderData = checkoutRes.data.data;

      await billingApi.verifyPayment({
        order_id: orderData.order_id,
        plan_code: selectedPlanForModal.code,
        billing_cycle: billingCycle,
        utr_number: utrNumber.trim() || 'UPI-MANUAL-VERIFIED',
      });

      qc.invalidateQueries({ queryKey: ['subscription'] });
      alert(`🎉 Payment received & verified! Subscription activated for ConstructPro ${selectedPlanForModal.name}!`);
      setSelectedPlanForModal(null);
      navigate('/settings/billing');
    } catch (err: any) {
      alert(err.response?.data?.detail?.message || 'Payment verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-white bg-dotted-pattern text-neutral-900 flex flex-col justify-between">
      {/* Top Header Navigation */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center font-black text-white text-xl shadow-md shadow-neutral-900/10">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl text-neutral-900 tracking-tight">Construct<span className="text-neutral-500">Pro</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <Link to="/pricing" className="text-neutral-900 font-bold">Pricing</Link>
            <Link to="/about" className="hover:text-neutral-900 transition-colors">About Us</Link>
            <Link to="/terms" className="hover:text-neutral-900 transition-colors">Terms &amp; Conditions</Link>
            <Link to="/support" className="hover:text-neutral-900 transition-colors">Support</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/login')} className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors">
              Log in
            </button>
            <button onClick={() => navigate('/register')} className="px-4 py-2 text-sm font-bold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 shadow-md shadow-neutral-900/10 transition-all">
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        {/* FREE TRIAL BANNER (Monochrome Black & White) */}
        <div className="relative overflow-hidden rounded-3xl mb-12 bg-neutral-900 text-white shadow-xl">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative px-8 py-10 sm:px-12 sm:py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 text-white">
                <Gift className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/20 text-xs font-bold uppercase tracking-wider">
                    Limited Time Offer
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  30-Day Free Trial — No Card Required
                </h2>
                <p className="text-neutral-300 font-medium mt-1.5 max-w-xl text-sm sm:text-base">
                  Get full access to all Professional features for 30 days. Manage projects, workers, expenses
                  and reports — completely free.
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  {[
                    { icon: Zap, label: '5 active projects' },
                    { icon: Clock, label: '30 days free' },
                    { icon: Check, label: 'No credit card' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-neutral-300 text-sm font-bold">
                      <Icon className="w-4 h-4 text-white" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-7 py-3.5 bg-white text-neutral-950 rounded-2xl font-extrabold text-base shadow-xl hover:bg-neutral-100 transition-all duration-200"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-neutral-400 font-medium text-xs text-center mt-2.5">No commitment · Cancel anytime</p>
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 uppercase tracking-wider">
            Simple &amp; Transparent Pricing
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 mt-4 tracking-tight">
            Control Every Project. Every Worker. Every Rupee.
          </h1>
          <p className="text-base text-neutral-500 font-medium mt-3">
            Choose the right subscription plan for your construction business size. No hidden fees.
          </p>

          {/* Toggle Monthly / Annual */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-bold ${billingCycle === 'MONTHLY' ? 'text-neutral-900' : 'text-neutral-400'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(c => c === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY')}
              className="w-14 h-8 bg-neutral-200 rounded-full p-1 transition-colors relative"
            >
              <div
                className={`w-6 h-6 rounded-full bg-neutral-900 transition-transform ${
                  billingCycle === 'ANNUAL' ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-bold flex items-center gap-1.5 ${billingCycle === 'ANNUAL' ? 'text-neutral-900' : 'text-neutral-400'}`}>
              Annual Billing
              <span className="px-2 py-0.5 rounded bg-neutral-900 text-white text-xs font-bold">
                Save ~16%
              </span>
            </span>
          </div>
        </div>

        {isLoading && <LoadingSpinner />}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((p: any) => {
            const isPopular = p.code === 'PROFESSIONAL';
            const price = billingCycle === 'ANNUAL' ? p.annual_price : p.monthly_price;

            return (
              <div
                key={p.id}
                className={`bg-white/80 border rounded-3xl p-6 flex flex-col justify-between relative transition-all duration-200 backdrop-blur-md ${
                  isPopular ? 'border-neutral-900 shadow-xl ring-2 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black text-neutral-900">{p.name}</h3>
                  <p className="text-xs text-neutral-500 mt-1 min-h-[36px] font-medium">{p.description}</p>

                  <div className="my-5">
                    {p.code === 'ENTERPRISE' ? (
                      <div className="text-2xl font-black text-neutral-900">Custom Pricing</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-neutral-900">
                          {formatRupees(price)}
                        </span>
                        <span className="text-xs text-neutral-500 font-bold">
                          /{billingCycle === 'ANNUAL' ? 'yr' : 'mo'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Core Limits */}
                  <div className="space-y-2 py-4 border-t border-b border-neutral-200 text-xs font-bold text-neutral-800">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neutral-900" />
                      <span>{p.is_unlimited_projects ? 'Unlimited' : p.max_projects} Active Projects</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neutral-900" />
                      <span>{p.is_unlimited_workers ? 'Unlimited' : p.max_workers} Workers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-neutral-900" />
                      <span>{p.max_users} Team User(s)</span>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="mt-4 space-y-2 text-xs text-neutral-600 font-medium">
                    {p.features?.filter((f: any) => 
                      !['ADVANCED_PERMISSIONS', 'ADMIN_ROLES', 'ROLES_PERMISSIONS'].includes(f.code) &&
                      !f.name.toLowerCase().includes('admin') &&
                      !f.name.toLowerCase().includes('role') &&
                      !f.name.toLowerCase().includes('permission')
                    ).map((f: any) => (
                      <div key={f.code} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-neutral-900 flex-shrink-0 mt-0.5" />
                        <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={() => handleSelectPlan(p)}
                    className={`w-full py-3 px-4 rounded-xl font-extrabold text-sm transition-all ${
                      isPopular
                        ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-md'
                        : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200'
                    }`}
                  >
                    {p.code === 'ENTERPRISE' ? 'Contact Sales' : `Choose ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── UPI Payment QR Modal ────────────────────────────────────────────────── */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-scale-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 relative text-neutral-900">
            <button
              onClick={() => setSelectedPlanForModal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 font-bold"
            >
              ✕
            </button>

            <div className="text-center">
              <span className="px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-black uppercase tracking-wider">
                Scan &amp; Pay via UPI
              </span>
              <h3 className="text-xl font-black mt-3 text-neutral-900">
                {selectedPlanForModal.name} Plan
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Amount to pay: <span className="font-bold text-neutral-900">{formatRupees(billingCycle === 'ANNUAL' ? selectedPlanForModal.annual_price : selectedPlanForModal.monthly_price)}</span> ({billingCycle.toLowerCase()})
              </p>
            </div>

            {/* QR Code Container */}
            <div className="my-5 p-4 bg-dotted-pattern border border-neutral-200 rounded-2xl flex flex-col items-center justify-center text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  `upi://pay?pa=8827401086@kotak&pn=ConstructPro&am=${billingCycle === 'ANNUAL' ? selectedPlanForModal.annual_price : selectedPlanForModal.monthly_price}&cu=INR&tn=ConstructPro%20${selectedPlanForModal.code}%20Subscription`
                )}`}
                alt="UPI Payment QR Code"
                className="w-48 h-48 rounded-xl shadow-md border border-neutral-200 bg-white p-2"
              />

              <div className="mt-3 bg-neutral-900 text-white rounded-xl px-4 py-2 text-xs font-mono font-bold flex items-center gap-2">
                <span>UPI ID: 8827401086@kotak</span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5 font-medium">
                Scan using GPay, PhonePe, Paytm, BHIM, or Kotak App
              </p>
            </div>

            {/* Verification Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  12-Digit UPI UTR / Transaction Ref No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Enter 12-digit UTR (e.g. 423981294812)"
                  value={utrNumber}
                  onChange={e => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <button
                onClick={handleConfirmUPIPayment}
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-xl bg-neutral-900 text-white font-extrabold text-sm hover:bg-neutral-800 transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying &amp; Activating...</span>
                  </>
                ) : (
                  <span>I Have Paid — Activate Subscription 🎉</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} ConstructPro Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-neutral-900 font-medium">Pricing</Link>
            <Link to="/about" className="hover:text-neutral-900 font-medium">About Us</Link>
            <Link to="/terms" className="hover:text-neutral-900 font-medium">Terms &amp; Conditions</Link>
            <Link to="/support" className="hover:text-neutral-900 font-medium">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

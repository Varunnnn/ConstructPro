import { useNavigate, Link } from 'react-router-dom';
import { Building2, Shield, FileCheck, Lock, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white bg-dotted-pattern text-neutral-900 flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center font-black text-white text-xl shadow-md shadow-neutral-900/10">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl text-neutral-900 tracking-tight">Construct<span className="text-neutral-500">Pro</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <Link to="/pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
            <Link to="/about" className="hover:text-neutral-900 transition-colors">About Us</Link>
            <Link to="/terms" className="text-neutral-900 font-bold">Terms &amp; Conditions</Link>
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

      {/* Main Legal Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 uppercase tracking-wider">
            Legal &amp; Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 mt-4 tracking-tight">
            Terms &amp; Conditions of Service
          </h1>
          <p className="text-neutral-500 text-xs sm:text-sm mt-2 font-medium">
            Effective Date: January 1, 2026 · Last Updated: August 2026
          </p>
        </div>

        <div className="bg-white/80 border border-neutral-200 rounded-3xl p-8 sm:p-12 space-y-8 text-neutral-700 text-xs sm:text-sm leading-relaxed backdrop-blur-md shadow-sm">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-neutral-900" />
              1. Acceptance of Terms
            </h2>
            <p className="font-medium">
              By registering an account, accessing, or using the ConstructPro platform, mobile applications, or associated API services, you agree to be bound by these Terms and Conditions. If you are entering into this agreement on behalf of a company or organization, you represent that you have the authority to bind such entity.
            </p>
          </section>

          <section className="space-y-3 border-t border-neutral-200 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-neutral-900" />
              2. Subscription Plans &amp; Billing
            </h2>
            <p className="font-medium">
              ConstructPro services are billed on a recurring subscription basis (Monthly or Annual). The 30-day Free Trial provides non-expiring full features during the trial window. Upon expiration, access to project creation will require selecting an active subscription plan (Starter, Professional, Business, or Enterprise).
            </p>
            <ul className="list-disc pl-5 space-y-1 text-neutral-600 font-medium">
              <li>Payments are processed securely via encrypted gateways (Razorpay/Stripe).</li>
              <li>Subscriptions auto-renew unless cancelled at least 24 hours prior to the billing date.</li>
              <li>GST invoices are automatically generated and available in the billing portal.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-neutral-200 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-neutral-900" />
              3. Data Ownership &amp; Privacy
            </h2>
            <p className="font-medium">
              You retain 100% sole ownership over all project schedules, worker attendance records, financial logs, and material transaction data entered into ConstructPro. ConstructPro will never sell, lease, or monetize customer data to third parties.
            </p>
          </section>

          <section className="space-y-3 border-t border-neutral-200 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-neutral-900" />
              4. Service Availability &amp; SLA
            </h2>
            <p className="font-medium">
              We commit to a 99.9% uptime SLA for core API operations, offline syncing mechanisms, and data backup routines. Automated daily backups are maintained across redundant multi-region servers.
            </p>
          </section>

          <section className="space-y-3 border-t border-neutral-200 pt-6">
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 flex items-center gap-2">
              5. Contact Information
            </h2>
            <p className="font-medium">
              For legal inquiries or terms clarification, please contact our legal team at <a href="mailto:legal@constructpro.in" className="text-neutral-900 font-bold hover:underline">legal@constructpro.in</a>.
            </p>
          </section>
        </div>
      </main>

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

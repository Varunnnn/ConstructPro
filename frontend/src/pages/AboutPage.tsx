import { useNavigate, Link } from 'react-router-dom';
import { Building2, Shield, Users, Award } from 'lucide-react';

export default function AboutPage() {
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
            <Link to="/about" className="text-neutral-900 font-bold">About Us</Link>
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

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 uppercase tracking-wider">
              Empowering Construction Businesses
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 mt-5 tracking-tight leading-tight">
              Reinventing How Construction Contractors Manage <span className="text-neutral-500">Projects, People &amp; Profit</span>
            </h1>
            <p className="text-base text-neutral-600 mt-4 leading-relaxed font-medium">
              ConstructPro was built with a single mission: to eliminate leakages, manual guesswork, and endless site delays for modern general contractors, sub-contractors, and site engineers.
            </p>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/80 border border-neutral-200 rounded-3xl p-8 backdrop-blur-md shadow-sm">
            {[
              { label: 'Active Projects Managed', value: '10,000+' },
              { label: 'Daily Worker Check-ins', value: '150,000+' },
              { label: 'Payroll & Expense Saved', value: '₹50Cr+' },
              { label: 'Contractor Satisfaction', value: '99.4%' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl sm:text-4xl font-black text-neutral-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-neutral-500 mt-1 font-bold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Values */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-neutral-900 mb-10 tracking-tight">
            Why Contractors Trust ConstructPro
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Real-Time Financial Control',
                desc: 'Track every rupee spent across daily worker attendance, raw materials, supplier advances, and equipment expenses with automatic budget alerts.'
              },
              {
                icon: Users,
                title: 'Worker & Attendance Verification',
                desc: 'Geo-tagged attendance, daily wage automation, wage slip generation, and attendance logging designed for site supervisors.'
              },
              {
                icon: Award,
                title: 'Bank-Grade Data Security',
                desc: 'End-to-end encrypted transactions, granular role permissions, and immutable audit logs keep your proprietary cost data completely leak-proof.'
              }
            ].map((card, idx) => (
              <div key={idx} className="bg-white/80 border border-neutral-200 hover:border-neutral-400 transition-all p-8 rounded-2xl group shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-md">
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{card.title}</h3>
                <p className="text-neutral-600 text-xs sm:text-sm leading-relaxed font-medium">{card.desc}</p>
              </div>
            ))}
          </div>
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

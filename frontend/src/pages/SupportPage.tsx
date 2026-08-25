import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, PhoneCall, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function SupportPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            <Link to="/terms" className="hover:text-neutral-900 transition-colors">Terms &amp; Conditions</Link>
            <Link to="/support" className="text-neutral-900 font-bold">Support</Link>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200 uppercase tracking-wider">
            24/7 Dedicated Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 mt-4 tracking-tight">
            We’re Here to Help Your Site Succeed
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base mt-2 font-medium">
            Have questions about subscriptions, setup, worker onboarding, or custom features? Our technical team is ready.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Cards */}
          <div className="space-y-4">
            {[
              {
                icon: PhoneCall,
                title: 'Phone Support',
                detail: '+91 1800-419-8800',
                sub: 'Mon - Sat (8:00 AM - 8:00 PM IST)'
              },
              {
                icon: Mail,
                title: 'Email Us',
                detail: 'support@constructpro.in',
                sub: 'Average response time: < 2 hours'
              },
              {
                icon: MapPin,
                title: 'Head Office',
                detail: 'ConstructPro Tower, Cyber City',
                sub: 'Gurugram, Haryana 122002, India'
              }
            ].map((c, i) => (
              <div key={i} className="bg-white/80 border border-neutral-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm backdrop-blur-md">
                <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                  <c.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">{c.title}</h3>
                  <p className="text-neutral-900 font-extrabold text-sm mt-0.5">{c.detail}</p>
                  <p className="text-neutral-500 text-xs mt-1 font-medium">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white/80 border border-neutral-200 rounded-3xl p-8 sm:p-10 backdrop-blur-md shadow-sm">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-neutral-900">Ticket Submitted Successfully!</h3>
                <p className="text-neutral-600 text-xs sm:text-sm max-w-md mx-auto font-medium">
                  Thank you for contacting ConstructPro support. A ticket has been raised and our site engineers will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl text-xs font-bold hover:bg-neutral-200 transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Send us a direct message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Sharma"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Question about Professional plan project limits"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your issue or inquiry in detail..."
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 bg-neutral-900 text-white font-extrabold rounded-xl hover:bg-neutral-800 shadow-md shadow-neutral-900/10 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <Send className="w-4 h-4 text-white" />
                  Submit Support Ticket
                </button>
              </form>
            )}
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

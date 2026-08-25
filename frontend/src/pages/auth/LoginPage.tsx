import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { sanitizeInput } from '../../utils';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const cleanEmail = sanitizeInput(email);
    const cleanPassword = password.trim();

    try {
      const loggedUser = await login(cleanEmail, cleanPassword);
      if (loggedUser?.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object' && detail?.code === 'ACCOUNT_LOCKED_PASSWORD_RESET_REQUIRED') {
        setError(detail.message);
      } else {
        setError(typeof detail === 'string' ? detail : 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user.email) {
        const loggedUser = await loginWithGoogle(
          user.email,
          user.displayName || user.email.split('@')[0],
          user.uid
        );
        if (loggedUser?.role === 'super_admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing login.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Sign-in popup request was cancelled.');
      } else {
        setError(err.message || 'Google sign-in failed. Please ensure popup blocker is disabled.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white bg-dotted-pattern text-neutral-900 flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glows (Crisp Gray/White) */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neutral-200/50 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neutral-300/40 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center font-black text-white text-xl shadow-md shadow-neutral-900/10">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-xl text-neutral-900 tracking-tight">Construct<span className="text-neutral-500">Pro</span></span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <Link to="/pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
            <Link to="/about" className="hover:text-neutral-900 transition-colors">About Us</Link>
            <Link to="/terms" className="hover:text-neutral-900 transition-colors">Terms &amp; Conditions</Link>
            <Link to="/support" className="hover:text-neutral-900 transition-colors">Support</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/register" className="px-4 py-2 text-sm font-bold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 shadow-md shadow-neutral-900/10 transition-all">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero & Features Info */}
          <div className="lg:col-span-7 space-y-6 text-left pr-0 lg:pr-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-neutral-900" /> Next-Gen Construction ERP
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-tight">
              Control Every Project. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500">
                Every Worker. Every Rupee.
              </span>
            </h1>

            <p className="text-neutral-600 text-base leading-relaxed max-w-xl font-medium">
              ConstructPro gives general contractors, builders, and site supervisors real-time financial tracking, attendance logs, and material budget control in one unified portal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                'Real-Time MRR & Financial Logs',
                'Geo-Tagged Worker Attendance',
                'Automated Material Inventory',
                'GST Invoices & Instant Receipts'
              ].map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-neutral-700 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4 text-neutral-900 flex-shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Login Card (Glassmorphic Light Mode) */}
          <div className="lg:col-span-5">
            <div className="bg-white/80 border border-neutral-200 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative">
              <div className="mb-6">
                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Welcome back</h2>
                <p className="text-neutral-500 text-xs mt-1 font-medium">Sign in to manage your construction sites</p>
              </div>

              {error && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2 font-medium">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Firebase Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3 px-4 bg-white border border-neutral-300 rounded-xl text-neutral-900 text-sm font-bold hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 mb-5 shadow-sm"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                )}
                {googleLoading ? 'Connecting Google...' : 'Sign in with Google'}
              </button>

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-neutral-200 w-full" />
                <span className="bg-white px-3 text-xs text-neutral-400 font-bold uppercase absolute">or</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-colors pr-10"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-neutral-900 text-white font-extrabold rounded-xl hover:bg-neutral-800 shadow-md shadow-neutral-900/10 transition-all flex items-center justify-center gap-2 text-sm mt-2"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : null}
                  {loading ? 'Signing in...' : 'Sign in to Dashboard'}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-neutral-500 font-medium">
                New to ConstructPro?{' '}
                <Link to="/register" className="text-neutral-900 font-black hover:underline">
                  Create an account
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Nav Links */}
      <footer className="border-t border-neutral-200/80 bg-white/80 py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} ConstructPro Technologies Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
            <Link to="/about" className="hover:text-neutral-900 transition-colors">About Us</Link>
            <Link to="/terms" className="hover:text-neutral-900 transition-colors">Terms &amp; Conditions</Link>
            <Link to="/support" className="hover:text-neutral-900 transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

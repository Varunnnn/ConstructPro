import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Building2, FileText, LogOut, X, Menu } from 'lucide-react';
import { cn } from '../utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_NAV = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Revenue Dashboard' },
  { to: '/admin/organizations', icon: Building2, label: 'Organizations' },
  { to: '/admin/audit-logs', icon: FileText, label: 'Audit Logs' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('admin_mode');
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen bg-white bg-dotted-pattern text-neutral-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-neutral-200 flex flex-col shadow-2xl">
            <AdminSidebarContent nav={ADMIN_NAV} onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/90 border-r border-neutral-200 backdrop-blur-xl fixed inset-y-0 z-30">
        <AdminSidebarContent nav={ADMIN_NAV} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-600 hover:text-neutral-900 p-1.5 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-neutral-900" />
            <span className="text-sm font-bold text-neutral-900">Admin Portal</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Admin badge bar */}
        <div className="bg-neutral-900 text-white text-xs font-bold py-2 px-6 flex items-center justify-between border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-white" />
            <span>ConstructPro Platform Super Admin Portal</span>
          </div>
          <button onClick={() => navigate('/')} className="text-neutral-300 hover:text-white underline font-semibold text-xs">
            Return to Contractor App →
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminSidebarContent({
  nav, onLogout, onClose
}: {
  nav: typeof ADMIN_NAV;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-neutral-900 tracking-tight">Super Admin</p>
            <p className="text-[11px] text-neutral-500 font-medium">ConstructPro Platform</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-neutral-900 text-white font-bold shadow-md shadow-neutral-900/10'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-neutral-400')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 text-neutral-700 hover:bg-red-50 hover:text-red-600 font-bold text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out Admin
        </button>
      </div>
    </div>
  );
}

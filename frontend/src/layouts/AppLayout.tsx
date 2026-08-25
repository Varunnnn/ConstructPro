import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, Users, ClipboardList,
  Receipt, Package, BarChart3, Settings, Menu, X,
  Plus, LogOut, Building2, ChevronDown, Shield,
  Calculator, Camera, UserCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils';
import QuickAddModal from '../components/ui/QuickAddModal';
import TrialBanner from '../components/ui/TrialBanner';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/workers', icon: Users, label: 'Workers' },
  { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/materials', icon: Package, label: 'Materials' },
  { to: '/estimates', icon: Calculator, label: 'Estimates & BOQ' },
  { to: '/site-updates', icon: Camera, label: 'Daily Work Logs' },
  { to: '/clients', icon: UserCheck, label: 'Clients & Invoices' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const MOBILE_NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Home', exact: true },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/workers', icon: Users, label: 'Workers' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, organization, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white bg-dotted-pattern text-neutral-900 flex flex-col lg:flex-row">
      {/* ── Desktop Sidebar (Smart Clean White & Gray) ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/90 border-r border-neutral-200/80 backdrop-blur-xl fixed inset-y-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-200/80">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center font-black text-white text-xl shadow-md shadow-neutral-900/10 flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-900 tracking-tight truncate">Construct<span className="text-neutral-500">Pro</span></p>
            <p className="text-xs text-neutral-500 truncate font-medium">{organization?.name || 'My Company'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-neutral-900 text-white font-bold shadow-md shadow-neutral-900/10'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4 flex-shrink-0 transition-colors', isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-700')} />
                  {label}
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User menu */}
        <div className="p-3 border-t border-neutral-200/80">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-100 transition-colors text-left group"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-neutral-900">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">{user?.full_name}</p>
              <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700" />
          </button>
          {userMenuOpen && (
            <div className="mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl backdrop-blur-2xl overflow-hidden text-xs">
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Settings className="w-4 h-4 text-neutral-400" /> Settings
              </button>
              <button
                onClick={() => navigate('/settings/billing')}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Package className="w-4 h-4 text-neutral-400" /> Subscription &amp; Billing
              </button>
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-neutral-900 hover:bg-neutral-100 font-bold"
                >
                  <Shield className="w-4 h-4 text-neutral-900" /> Admin Portal
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 font-semibold"
              >
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r border-neutral-200 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center font-black text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-900">Construct<span className="text-neutral-500">Pro</span></p>
                  <p className="text-xs text-neutral-500">{organization?.name}</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-neutral-400')} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-neutral-200">
              <button onClick={handleLogout} className="w-full py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 text-sm hover:bg-red-100">
                <LogOut className="w-4 h-4" /> Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Dynamic Trial/Status Banner */}
        <TrialBanner />

        {/* Mobile top bar */}
        <header className="lg:hidden bg-white/90 border-b border-neutral-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-neutral-700 hover:text-neutral-900 rounded-lg bg-neutral-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-black">
              <Building2 className="w-4 h-4" />
            </div>
            <span className="text-sm font-extrabold text-neutral-900">Construct<span className="text-neutral-500">Pro</span></span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 border-t border-neutral-200 z-20 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-2">
          {MOBILE_NAV.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all min-w-[56px]',
                isActive ? 'text-neutral-900 font-bold' : 'text-neutral-400'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-5 h-5', isActive && 'text-neutral-900')} />
                  <span className="text-[10px]">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Center + button */}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="flex flex-col items-center gap-0.5 -mt-4"
          >
            <div className="w-13 h-13 rounded-full bg-neutral-900 shadow-lg shadow-neutral-900/20 flex items-center justify-center text-white active:scale-95 transition-all">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <span className="text-[10px] font-bold text-neutral-900 mt-0.5">Add</span>
          </button>
        </div>
      </nav>

      {/* Quick Add Modal */}
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

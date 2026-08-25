import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Receipt, Package, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard, LoadingSpinner, ErrorMessage } from '../../components/ui';
import { formatRupees, formatRelativeTime, ENTITY_TYPE_ICONS } from '../../utils';
import type { Dashboard } from '../../types';

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<Dashboard>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await dashboardApi.get();
      return res.data.data;
    },
  });

  const QUICK_ACTIONS = [
    { icon: ClipboardList, label: '+ Attendance', to: '/attendance', color: 'bg-black' },
    { icon: Receipt, label: '+ Expense', to: '/expenses/new', color: 'bg-black' },
    { icon: Package, label: '+ Material', to: '/materials/new', color: 'bg-black' },
    { icon: Users, label: '+ Worker', to: '/workers/new', color: 'bg-black' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const profit = data ? parseFloat(data.financials.estimated_profit) : 0;
  const isProfitable = profit >= 0;

  return (
    <div>
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-900">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="text-sm text-surface-500 mt-0.5">{organization?.name} — Today's overview</p>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load dashboard. Please refresh." />}

      {data && (
        <>
          {/* Financial cards */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">Financial Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                label="Total Contract Value"
                value={formatRupees(data.financials.total_contract_value)}
                color="default"
              />
              <StatCard
                label="Estimated Profit"
                value={formatRupees(data.financials.estimated_profit)}
                color={isProfitable ? 'green' : 'red'}
                icon={isProfitable ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
              />
              <StatCard
                label="Total Cost"
                value={formatRupees(data.financials.total_cost)}
                color="default"
              />
              <StatCard
                label="Labour Cost"
                value={formatRupees(data.financials.total_labour_cost)}
                color="default"
              />
              <StatCard
                label="Material Cost"
                value={formatRupees(data.financials.total_material_cost)}
                color="default"
              />
              <StatCard
                label="Other Expenses"
                value={formatRupees(data.financials.total_other_expenses)}
                color="default"
              />
            </div>
          </section>

          {/* Project summary */}
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">Projects</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => navigate('/projects?status=active')}
                className="card p-4 text-left hover:shadow-card-hover transition-shadow active:scale-95"
              >
                <p className="text-3xl font-bold text-surface-900">{data.project_summary.active}</p>
                <p className="text-xs text-surface-500 mt-0.5">Active</p>
              </button>
              <button
                onClick={() => navigate('/projects?status=completed')}
                className="card p-4 text-left hover:shadow-card-hover transition-shadow active:scale-95"
              >
                <p className="text-3xl font-bold text-surface-900">{data.project_summary.completed}</p>
                <p className="text-xs text-surface-500 mt-0.5">Completed</p>
              </button>
              <button
                onClick={() => navigate('/projects?status=planning')}
                className="card p-4 text-left hover:shadow-card-hover transition-shadow active:scale-95"
              >
                <p className="text-3xl font-bold text-surface-900">{data.project_summary.planning}</p>
                <p className="text-xs text-surface-500 mt-0.5">Planning</p>
              </button>
              <div className={`card p-4 ${data.project_summary.over_budget > 0 ? 'bg-red-50 border-red-200' : ''}`}>
                <div className="flex items-start gap-1">
                  <p className={`text-3xl font-bold ${data.project_summary.over_budget > 0 ? 'text-red-600' : 'text-surface-900'}`}>
                    {data.project_summary.over_budget}
                  </p>
                  {data.project_summary.over_budget > 0 && <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />}
                </div>
                <p className="text-xs text-surface-500 mt-0.5">Over Budget</p>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section className="mb-6 hidden lg:block">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-3">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ icon: Icon, label, to, color }) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className={`${color} text-white rounded-xl p-4 flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-card font-medium text-sm`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide">Recent Activity</h2>
            </div>
            <div className="card divide-y divide-surface-100">
              {data.recent_activity.length === 0 ? (
                <div className="p-6 text-center text-sm text-surface-400">No recent activity</div>
              ) : (
                data.recent_activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0 text-base">
                      {ENTITY_TYPE_ICONS[item.entity_type] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface-800">{item.description}</p>
                      {item.project_name && (
                        <p className="text-xs text-surface-400 mt-0.5">{item.project_name}</p>
                      )}
                    </div>
                    <span className="text-xs text-surface-400 flex-shrink-0">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

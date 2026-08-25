import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { formatRupees } from '../../utils';
import {
  TrendingUp, DollarSign,
  Activity, BarChart3, Zap, AlertTriangle
} from 'lucide-react';

function StatCard({
  label, value, sub, color, icon: Icon,
}: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-white/80 border border-neutral-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-neutral-300 transition-all backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-black mt-1.5 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-neutral-500 mt-1">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-neutral-100 border border-neutral-200">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function PlanBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-neutral-700 font-medium">{label}</span>
        <span className="text-neutral-900 font-bold">{count} <span className="text-neutral-500 font-normal">({pct}%)</span></span>
      </div>
      <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminApi.getDashboard()).data.data,
    refetchInterval: 60_000,
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600">
      <AlertTriangle className="w-5 h-5" />
      <div>
        <p className="font-bold">Failed to load admin dashboard</p>
        <p className="text-sm text-red-500 mt-0.5">Ensure you are logged in as a Super Admin.</p>
      </div>
    </div>
  );

  const stats = data;
  const orgs = stats?.organizations || {};
  const usage = stats?.usage || {};
  const planDist = stats?.plan_distribution || {};
  const totalPaidOrgs = Object.values(planDist as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Revenue Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">Real-time platform metrics — MRR, ARR, subscriptions, and usage.</p>
      </div>

      {/* Revenue KPIs */}
      <div>
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Revenue</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Monthly Recurring Revenue (MRR)"
            value={formatRupees(stats?.mrr || 0)}
            sub="From all active paid subscriptions"
            color="text-emerald-600"
            icon={DollarSign}
          />
          <StatCard
            label="Annual Recurring Revenue (ARR)"
            value={formatRupees(stats?.arr || 0)}
            sub="MRR × 12"
            color="text-emerald-700"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Subscription KPIs */}
      <div>
        <h2 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Subscriptions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Paid Customers" value={orgs.active_paid || 0} color="text-neutral-900" icon={Zap} />
          <StatCard label="Active Trials" value={orgs.trialing || 0} color="text-amber-600" icon={Activity} />
          <StatCard label="Trial Conversion" value={`${stats?.trial_conversion_rate_pct || 0}%`} sub="Trials → Paid" color="text-sky-600" icon={BarChart3} />
          <StatCard label="Expired / Churned" value={(orgs.expired || 0) + (orgs.cancelled || 0)} color="text-red-600" icon={AlertTriangle} />
        </div>
      </div>

      {/* Plan Distribution + Platform Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Breakdown */}
        <div className="bg-white/80 border border-neutral-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
          <h3 className="text-sm font-bold text-neutral-900 mb-5">Active Plan Distribution</h3>
          <div className="space-y-4">
            <PlanBar label="Starter" count={planDist.STARTER || 0} total={totalPaidOrgs} color="bg-sky-500" />
            <PlanBar label="Professional" count={planDist.PROFESSIONAL || 0} total={totalPaidOrgs} color="bg-neutral-900" />
            <PlanBar label="Business" count={planDist.BUSINESS || 0} total={totalPaidOrgs} color="bg-neutral-700" />
            <PlanBar label="Enterprise" count={planDist.ENTERPRISE || 0} total={totalPaidOrgs} color="bg-amber-500" />
          </div>
          {totalPaidOrgs === 0 && (
            <p className="text-sm text-neutral-500 text-center mt-4">No paid subscribers yet.</p>
          )}
        </div>

        {/* Platform Usage */}
        <div className="bg-white/80 border border-neutral-200 rounded-2xl p-6 shadow-sm backdrop-blur-md">
          <h3 className="text-sm font-bold text-neutral-900 mb-5">Platform Usage</h3>
          <div className="space-y-5">
            {[
              { label: 'Total Organizations', value: orgs.total || 0, icon: '🏢' },
              { label: 'Total Projects', value: usage.total_projects || 0, icon: '📋' },
              { label: 'Total Workers', value: usage.total_workers || 0, icon: '👷' },
              { label: 'Total Users', value: usage.total_users || 0, icon: '👤' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm text-neutral-700 font-medium">{label}</span>
                </div>
                <span className="text-sm font-extrabold text-neutral-900">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

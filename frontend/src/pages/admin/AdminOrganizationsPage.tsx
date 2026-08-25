import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { Search, X, AlertTriangle, Check } from 'lucide-react';
import { formatDate } from '../../utils';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TRIALING: 'bg-amber-50 text-amber-700 border-amber-200',
  EXPIRED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  PAST_DUE: 'bg-orange-50 text-orange-700 border-orange-200',
  NONE: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export default function AdminOrganizationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [assignPlanCode, setAssignPlanCode] = useState('PROFESSIONAL');
  const [assignBillingCycle, setAssignBillingCycle] = useState('MONTHLY');
  const [extendDays, setExtendDays] = useState('14');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orgs', search, statusFilter],
    queryFn: async () =>
      (await adminApi.getOrganizations({ search: search || undefined, status_filter: statusFilter || undefined })).data.data,
  });

  const orgs = data || [];

  const notify = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAssignPlan = async () => {
    if (!selectedOrg) return;
    setActionLoading('plan');
    try {
      await adminApi.assignPlan(selectedOrg.id, {
        plan_code: assignPlanCode,
        billing_cycle: assignBillingCycle,
      });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      notify(`✅ ${assignPlanCode} plan assigned to ${selectedOrg.name}`);
      setSelectedOrg(null);
    } catch {
      alert('Failed to assign plan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendTrial = async () => {
    if (!selectedOrg) return;
    setActionLoading('trial');
    try {
      await adminApi.extendTrial(selectedOrg.id, { days: parseInt(extendDays, 10) });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      notify(`✅ Extended trial for ${selectedOrg.name} by ${extendDays} days`);
      setSelectedOrg(null);
    } catch {
      alert('Failed to extend trial.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Customer Organizations</h1>
        <p className="text-neutral-500 text-sm mt-1">Manage all subscribed contractor accounts, assign custom plans, or extend trials.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-sm flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by organization name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-neutral-200 text-neutral-900 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-900 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-neutral-900 cursor-pointer"
          >
            <option value="">All Subscription Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white/80 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No organizations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 uppercase tracking-wider bg-neutral-50/50">
                  <th className="px-5 py-4 font-bold">Organization</th>
                  <th className="px-5 py-4 font-bold">Owner</th>
                  <th className="px-5 py-4 font-bold">Plan</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 font-bold">Usage</th>
                  <th className="px-5 py-4 font-bold">Renewal</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orgs.map((org: any) => (
                  <tr key={org.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-neutral-900">{org.name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Since {formatDate(org.created_at)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-neutral-900 font-medium">{org.owner?.name}</p>
                      <p className="text-xs text-neutral-500">{org.owner?.email}</p>
                      {org.owner?.mobile && (
                        <p className="text-xs text-neutral-500">{org.owner?.mobile}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-neutral-900">{org.subscription?.plan_name}</p>
                      <p className="text-xs text-neutral-500">{org.subscription?.billing_cycle || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase border ${STATUS_STYLES[org.subscription?.status] || STATUS_STYLES.NONE}`}>
                        {org.subscription?.status || 'NONE'}
                      </span>
                      {org.subscription?.trial_ends_at && org.subscription?.status === 'TRIALING' && (
                        <p className="text-xs text-amber-700 font-medium mt-1">Ends {formatDate(org.subscription.trial_ends_at)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-neutral-700 space-y-0.5">
                        <p><span className="text-neutral-500">Projects:</span> {org.usage?.projects}</p>
                        <p><span className="text-neutral-500">Workers:</span> {org.usage?.workers}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-500">
                      {org.subscription?.current_period_end
                        ? formatDate(org.subscription.current_period_end)
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Management Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm" onClick={() => setSelectedOrg(null)} />
          <div className="relative bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">{selectedOrg.name}</h3>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {selectedOrg.owner?.email} · Current: <span className="text-neutral-900 font-extrabold">{selectedOrg.subscription?.plan_name}</span>
                </p>
              </div>
              <button onClick={() => setSelectedOrg(null)} className="text-neutral-400 hover:text-neutral-900 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <hr className="border-neutral-200" />

            {/* Assign Plan */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Assign / Override Plan</h4>
              <div className="flex gap-2">
                <select
                  value={assignPlanCode}
                  onChange={e => setAssignPlanCode(e.target.value)}
                  className="flex-1 bg-white border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                >
                  <option value="STARTER">Starter</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="BUSINESS">Business</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
                <select
                  value={assignBillingCycle}
                  onChange={e => setAssignBillingCycle(e.target.value)}
                  className="bg-white border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
                <button
                  onClick={handleAssignPlan}
                  disabled={actionLoading === 'plan'}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  {actionLoading === 'plan' ? '...' : 'Assign'}
                </button>
              </div>
            </div>

            <hr className="border-neutral-200" />

            {/* Extend Trial */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Extend Free Trial</h4>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={extendDays}
                    onChange={e => setExtendDays(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neutral-900"
                    placeholder="Days to extend"
                  />
                </div>
                <button
                  onClick={handleExtendTrial}
                  disabled={actionLoading === 'trial'}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                >
                  {actionLoading === 'trial' ? '...' : 'Extend Trial'}
                </button>
              </div>
              <p className="text-xs text-neutral-500">This will reset the trial status and push the end date forward.</p>
            </div>

            <hr className="border-neutral-200" />

            <div className="flex justify-end">
              <button onClick={() => setSelectedOrg(null)} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors font-semibold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

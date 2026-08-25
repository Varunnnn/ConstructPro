import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Shield, Search } from 'lucide-react';
import { adminApi } from '../../api/client';
import { LoadingSpinner } from '../../components/ui';
import { formatRupees } from '../../utils';

export default function AdminPortalPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [assignPlanCode, setAssignPlanCode] = useState('PROFESSIONAL');
  const [extendDays, setExtendDays] = useState('14');

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => (await adminApi.getDashboard()).data.data,
  });

  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin-orgs', search],
    queryFn: async () => (await adminApi.getOrganizations({ search })).data.data,
  });

  const handleAssignPlan = async (orgId: string) => {
    try {
      await adminApi.assignPlan(orgId, { plan_code: assignPlanCode, billing_cycle: 'ANNUAL' });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
      setSelectedOrg(null);
      alert(`Assigned ${assignPlanCode} plan successfully.`);
    } catch (err) {
      alert('Failed to assign plan.');
    }
  };

  const handleExtendTrial = async (orgId: string) => {
    try {
      await adminApi.extendTrial(orgId, { days: parseInt(extendDays) });
      qc.invalidateQueries({ queryKey: ['admin-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
      setSelectedOrg(null);
      alert(`Trial extended by ${extendDays} days.`);
    } catch (err) {
      alert('Failed to extend trial.');
    }
  };

  if (statsLoading || orgsLoading) return <LoadingSpinner />;

  const stats = statsData;
  const orgs = orgsData || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Super Admin Top Header */}
      <div className="flex items-center justify-between bg-surface-900 text-white p-6 rounded-2xl shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Super Admin Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">Platform Revenue & Customer Overview</h1>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-secondary text-surface-900">
          Back to SaaS Dashboard
        </button>
      </div>

      {/* Revenue & Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border-l-4 border-l-brand-600">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Monthly Recurring Revenue (MRR)</p>
          <p className="text-2xl font-black text-surface-900 mt-1">{formatRupees(stats?.mrr || 0)}</p>
        </div>

        <div className="card p-5 border-l-4 border-l-green-600">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Annual Recurring Revenue (ARR)</p>
          <p className="text-2xl font-black text-surface-900 mt-1">{formatRupees(stats?.arr || 0)}</p>
        </div>

        <div className="card p-5 border-l-4 border-l-blue-600">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Paid Customers</p>
          <p className="text-2xl font-black text-surface-900 mt-1">{stats?.organizations?.active_paid || 0}</p>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-500">
          <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Active Trials / Conversion</p>
          <p className="text-2xl font-black text-surface-900 mt-1">
            {stats?.organizations?.trialing || 0} <span className="text-xs font-normal text-surface-500">({stats?.trial_conversion_rate_pct}% conv.)</span>
          </p>
        </div>
      </div>

      {/* Customer Organizations Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <h2 className="text-lg font-bold text-surface-900">Customer Organizations</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              className="form-input pl-9"
              placeholder="Search company name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-left text-xs text-surface-500 uppercase">
                <th className="pb-3">Organization</th>
                <th className="pb-3">Owner Contact</th>
                <th className="pb-3">Plan</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Projects / Workers</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {orgs.map((org: any) => (
                <tr key={org.id} className="hover:bg-surface-50">
                  <td className="py-3.5 font-bold text-surface-900">{org.name}</td>
                  <td className="py-3.5">
                    <p className="font-semibold text-surface-900">{org.owner?.name}</p>
                    <p className="text-xs text-surface-400">{org.owner?.email} · {org.owner?.mobile}</p>
                  </td>
                  <td className="py-3.5 font-semibold text-brand-700">{org.subscription?.plan_name}</td>
                  <td className="py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      org.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      org.subscription?.status === 'TRIALING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {org.subscription?.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-medium text-surface-700">
                    {org.usage?.projects} projects · {org.usage?.workers} workers
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => setSelectedOrg(org)}
                      className="btn-secondary btn-sm"
                    >
                      Manage Subscription
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Management Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-modal space-y-4">
            <h3 className="text-lg font-bold text-surface-900">Manage: {selectedOrg.name}</h3>

            <div className="space-y-3 pt-2">
              <div>
                <label className="form-label">Assign Plan (Enterprise / Override)</label>
                <div className="flex gap-2">
                  <select className="form-select" value={assignPlanCode} onChange={e => setAssignPlanCode(e.target.value)}>
                    <option value="STARTER">Starter</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="BUSINESS">Business</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <button onClick={() => handleAssignPlan(selectedOrg.id)} className="btn-primary">
                    Assign
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-100">
                <label className="form-label">Extend Trial (Days)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="form-input"
                    value={extendDays}
                    onChange={e => setExtendDays(e.target.value)}
                  />
                  <button onClick={() => handleExtendTrial(selectedOrg.id)} className="btn-secondary">
                    Extend
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={() => setSelectedOrg(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Phone } from 'lucide-react';
import { workersApi } from '../../api/client';
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader, Badge } from '../../components/ui';
import { formatRupees, WORKER_TYPE_LABELS } from '../../utils';
import type { Worker } from '../../types';

const TYPE_OPTIONS = ['', 'mason', 'helper', 'carpenter', 'electrician', 'plumber', 'painter', 'other'];

export default function WorkersPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [workerType, setWorkerType] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const { data, isLoading, error } = useQuery({
    queryKey: ['workers', { search, workerType, statusFilter }],
    queryFn: async () => {
      const res = await workersApi.list({
        search: search || undefined,
        worker_type: workerType || undefined,
        status: statusFilter || undefined,
      });
      return res.data;
    },
  });

  const workers: Worker[] = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle={`${data?.total || 0} workers`}
        action={
          <button onClick={() => navigate('/workers/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input className="form-input pl-9" placeholder="Search workers..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select w-auto" value={workerType} onChange={e => setWorkerType(e.target.value)}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.filter(Boolean).map(t => (
            <option key={t} value={t}>{WORKER_TYPE_LABELS[t]}</option>
          ))}
        </select>
        <select className="form-select w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load workers." />}

      {!isLoading && workers.length === 0 && (
        <EmptyState
          icon={<Users className="w-8 h-8 text-surface-400" />}
          title="No workers yet"
          description="Add your construction workers to start tracking attendance and labour costs."
          action={
            <button onClick={() => navigate('/workers/new')} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Worker
            </button>
          }
        />
      )}

      {/* Mobile cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
        {workers.map(w => (
          <div
            key={w.id}
            onClick={() => navigate(`/workers/${w.id}`)}
            className="card-hover p-4 cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-brand-700">{w.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-surface-900 truncate">{w.name}</p>
                <p className="text-xs text-surface-500">{WORKER_TYPE_LABELS[w.worker_type]}</p>
              </div>
              <Badge status={w.status} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-500 text-xs">Daily Wage</span>
              <span className="font-bold text-surface-900">{formatRupees(w.daily_wage)}</span>
            </div>
            {w.mobile && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-surface-400">
                <Phone className="w-3 h-3" /> {w.mobile}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Worker</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Mobile</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Daily Wage</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {workers.map(w => (
              <tr key={w.id} onClick={() => navigate(`/workers/${w.id}`)}
                className="hover:bg-surface-50 cursor-pointer transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-brand-700">{w.name[0]}</span>
                    </div>
                    <span className="text-sm font-semibold text-surface-900">{w.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-surface-600">{WORKER_TYPE_LABELS[w.worker_type]}</td>
                <td className="px-5 py-4 text-sm text-surface-500">{w.mobile || '—'}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold text-surface-900">{formatRupees(w.daily_wage)}</td>
                <td className="px-5 py-4"><Badge status={w.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {workers.length === 0 && !isLoading && (
          <div className="py-12 text-center text-sm text-surface-400">No workers found</div>
        )}
      </div>
    </div>
  );
}

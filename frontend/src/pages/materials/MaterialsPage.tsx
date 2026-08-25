import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { materialsApi, projectsApi } from '../../api/client';
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader, Badge } from '../../components/ui';
import { formatRupees, formatDate, MATERIAL_CATEGORY_LABELS } from '../../utils';
import type { Material, Project } from '../../types';

const CATEGORIES = ['', 'cement', 'steel', 'sand', 'bricks', 'stone', 'plumbing', 'electrical', 'paint', 'hardware', 'other'];

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [projectFilter, setProjectFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data,
  });
  const projects: Project[] = projectsData?.data || [];

  const { data, isLoading, error } = useQuery({
    queryKey: ['materials', { projectFilter, categoryFilter, dateFrom, dateTo }],
    queryFn: async () => {
      const res = await materialsApi.list({
        project_id: projectFilter || undefined,
        category: categoryFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      return res.data;
    },
  });

  const materials: Material[] = data?.data || [];
  const total = materials.reduce((sum, m) => sum + parseFloat(m.total_amount), 0);

  return (
    <div>
      <PageHeader
        title="Materials"
        subtitle={materials.length > 0 ? `Total: ${formatRupees(total)}` : ''}
        action={
          <button onClick={() => navigate('/materials/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Material
          </button>
        }
      />

      {/* Filters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <select className="form-select" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="form-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{MATERIAL_CATEGORY_LABELS[c]}</option>)}
        </select>
        <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load materials." />}

      {!isLoading && materials.length === 0 && (
        <EmptyState
          icon={<Package className="w-8 h-8 text-surface-400" />}
          title="No material purchases"
          description="Track cement, steel, sand and other material purchases."
          action={<button onClick={() => navigate('/materials/new')} className="btn-primary"><Plus className="w-4 h-4" /> Add Material</button>}
        />
      )}

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {materials.map(m => (
          <div key={m.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1">
                <p className="text-sm font-bold text-surface-900">{m.material_name}</p>
                <p className="text-xs text-surface-400 mt-0.5">{m.project_name} · {MATERIAL_CATEGORY_LABELS[m.category]}</p>
              </div>
              <p className="text-base font-bold text-surface-900 flex-shrink-0">{formatRupees(m.total_amount)}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-surface-400">
              <span>{m.quantity} {m.unit} × {formatRupees(m.unit_price)}</span>
              <div className="flex items-center gap-2">
                {m.supplier && <span>{m.supplier}</span>}
                <Badge status={m.payment_status} />
              </div>
            </div>
            <p className="text-xs text-surface-400 mt-1">{formatDate(m.purchase_date)}</p>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Material</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Project</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Qty</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Unit Price</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Total</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Supplier</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {materials.map(m => (
              <tr key={m.id} className="hover:bg-surface-50">
                <td className="px-5 py-4 text-sm text-surface-600">{formatDate(m.purchase_date)}</td>
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-surface-900">{m.material_name}</p>
                  <p className="text-xs text-surface-400">{MATERIAL_CATEGORY_LABELS[m.category]}</p>
                </td>
                <td className="px-5 py-4 text-sm text-surface-600">{m.project_name || '—'}</td>
                <td className="px-5 py-4 text-right text-sm text-surface-600">{m.quantity} {m.unit}</td>
                <td className="px-5 py-4 text-right text-sm text-surface-600">{formatRupees(m.unit_price)}</td>
                <td className="px-5 py-4 text-right text-sm font-bold text-surface-900">{formatRupees(m.total_amount)}</td>
                <td className="px-5 py-4 text-sm text-surface-500">{m.supplier || '—'}</td>
                <td className="px-5 py-4"><Badge status={m.payment_status} /></td>
              </tr>
            ))}
          </tbody>
          {materials.length > 0 && (
            <tfoot className="border-t-2 border-surface-200">
              <tr>
                <td colSpan={5} className="px-5 py-3.5 text-sm font-bold text-surface-700">Total</td>
                <td className="px-5 py-3.5 text-right text-sm font-bold text-surface-900">{formatRupees(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
        {materials.length === 0 && !isLoading && (
          <div className="py-12 text-center text-sm text-surface-400">No materials found</div>
        )}
      </div>
    </div>
  );
}

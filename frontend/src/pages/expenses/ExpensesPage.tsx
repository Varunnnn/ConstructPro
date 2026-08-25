import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Receipt } from 'lucide-react';
import { expensesApi } from '../../api/client';
import { projectsApi } from '../../api/client';
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader } from '../../components/ui';
import { formatRupees, formatDate, EXPENSE_CATEGORY_LABELS, PAYMENT_METHOD_LABELS } from '../../utils';
import type { Expense, Project } from '../../types';

const CATEGORIES = ['', 'transport', 'fuel', 'electricity', 'tools', 'food', 'equipment', 'labour_advance', 'miscellaneous'];

export default function ExpensesPage() {
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
    queryKey: ['expenses', { projectFilter, categoryFilter, dateFrom, dateTo }],
    queryFn: async () => {
      const res = await expensesApi.list({
        project_id: projectFilter || undefined,
        category: categoryFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      return res.data;
    },
  });

  const expenses: Expense[] = data?.data || [];
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={expenses.length > 0 ? `Total: ${formatRupees(total)}` : ''}
        action={
          <button onClick={() => navigate('/expenses/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Expense
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
          {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>)}
        </select>
        <input type="date" className="form-input" placeholder="From" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="form-input" placeholder="To" value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load expenses." />}

      {!isLoading && expenses.length === 0 && (
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-surface-400" />}
          title="No expenses recorded"
          description="Track transport, fuel, food and other project expenses."
          action={<button onClick={() => navigate('/expenses/new')} className="btn-primary"><Plus className="w-4 h-4" /> Add Expense</button>}
        />
      )}

      {/* Mobile cards */}
      <div className="space-y-3 lg:hidden">
        {expenses.map(e => (
          <div key={e.id} className="card p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-bold text-surface-900">{EXPENSE_CATEGORY_LABELS[e.category] || e.category}</p>
                {e.project_name && <p className="text-xs text-surface-400 mt-0.5">{e.project_name}</p>}
              </div>
              <p className="text-base font-bold text-surface-900 flex-shrink-0">{formatRupees(e.amount)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-surface-400">{formatDate(e.date)} · {PAYMENT_METHOD_LABELS[e.payment_method]}</p>
              {e.description && <p className="text-xs text-surface-500 truncate max-w-[140px]">{e.description}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Project</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Category</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Payment</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {expenses.map(e => (
              <tr key={e.id} className="hover:bg-surface-50">
                <td className="px-5 py-4 text-sm text-surface-600">{formatDate(e.date)}</td>
                <td className="px-5 py-4 text-sm text-surface-600">{e.project_name || '—'}</td>
                <td className="px-5 py-4 text-sm font-medium text-surface-900">{EXPENSE_CATEGORY_LABELS[e.category] || e.category}</td>
                <td className="px-5 py-4 text-right text-sm font-bold text-surface-900">{formatRupees(e.amount)}</td>
                <td className="px-5 py-4 text-sm text-surface-500">{PAYMENT_METHOD_LABELS[e.payment_method]}</td>
                <td className="px-5 py-4 text-sm text-surface-400 max-w-xs truncate">{e.description || '—'}</td>
              </tr>
            ))}
          </tbody>
          {expenses.length > 0 && (
            <tfoot className="border-t-2 border-surface-200">
              <tr>
                <td colSpan={3} className="px-5 py-3.5 text-sm font-bold text-surface-700">Total</td>
                <td className="px-5 py-3.5 text-right text-sm font-bold text-surface-900">{formatRupees(total)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
        {expenses.length === 0 && !isLoading && (
          <div className="py-12 text-center text-sm text-surface-400">No expenses found</div>
        )}
      </div>
    </div>
  );
}

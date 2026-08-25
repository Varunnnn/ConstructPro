import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { reportsApi, projectsApi } from '../../api/client';
import { LoadingSpinner, ErrorMessage, PageHeader, Badge } from '../../components/ui';
import { formatRupees, formatDate, EXPENSE_CATEGORY_LABELS, WORKER_TYPE_LABELS } from '../../utils';
import type { Project, ProjectProfitRow, LabourRow, ExpenseRow, MaterialRow } from '../../types';

type TabKey = 'profit' | 'labour' | 'expenses' | 'materials';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('profit');
  const [projectFilter, setProjectFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data,
  });
  const projects: Project[] = projectsData?.data || [];

  // Report queries
  const profitQuery = useQuery<ProjectProfitRow[]>({
    queryKey: ['report-profit', projectFilter],
    queryFn: async () => (await reportsApi.projectProfit({ project_id: projectFilter || undefined })).data.data,
    enabled: activeTab === 'profit',
  });

  const labourQuery = useQuery<LabourRow[]>({
    queryKey: ['report-labour', projectFilter, dateFrom, dateTo],
    queryFn: async () => (await reportsApi.labour({
      project_id: projectFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })).data.data,
    enabled: activeTab === 'labour',
  });

  const expenseQuery = useQuery<ExpenseRow[]>({
    queryKey: ['report-expenses', projectFilter, dateFrom, dateTo],
    queryFn: async () => (await reportsApi.expenses({
      project_id: projectFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })).data.data,
    enabled: activeTab === 'expenses',
  });

  const materialQuery = useQuery<MaterialRow[]>({
    queryKey: ['report-materials', projectFilter, dateFrom, dateTo],
    queryFn: async () => (await reportsApi.materials({
      project_id: projectFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    })).data.data,
    enabled: activeTab === 'materials',
  });

  const handleExportCSV = async () => {
    const typeMap: Record<TabKey, string> = {
      profit: 'project-profit',
      labour: 'labour',
      expenses: 'expenses',
      materials: 'materials',
    };
    try {
      const res = await reportsApi.exportCsv(typeMap[activeTab], {
        project_id: projectFilter || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const yy = String(now.getFullYear()).slice(-2);
      const mm = pad(now.getMonth() + 1);
      const dd = pad(now.getDate());
      const hh = pad(now.getHours());
      const min = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      const filename = `ConstructPro-${yy}${mm}${dd}${hh}${min}${ss}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('CSV export failed', err);
    }
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'profit', label: 'Project Profit' },
    { key: 'labour', label: 'Labour' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'materials', label: 'Materials' },
  ];

  const isLoading = profitQuery.isLoading || labourQuery.isLoading || expenseQuery.isLoading || materialQuery.isLoading;
  const isError = profitQuery.error || labourQuery.error || expenseQuery.error || materialQuery.error;

  return (
    <div>
      <PageHeader
        title="Reports"
        action={
          <button onClick={handleExportCSV} className="btn-secondary">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 rounded-xl p-1 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === t.key ? 'bg-white shadow-card text-surface-900' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <select className="form-select flex-1 min-w-[160px]" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {activeTab !== 'profit' && (
          <>
            <input type="date" className="form-input flex-1 min-w-[140px]" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <input type="date" className="form-input flex-1 min-w-[140px]" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </>
        )}
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorMessage message="Failed to load report." />}

      {/* Project Profit Report */}
      {activeTab === 'profit' && profitQuery.data && (
        <div className="space-y-3">
          {profitQuery.data.length === 0 && <div className="card p-8 text-center text-sm text-surface-400">No data</div>}
          {profitQuery.data.map(row => {
            const profit = parseFloat(row.profit);
            return (
              <div key={row.project_id} className="card p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-bold text-surface-900">{row.project_name}</p>
                    <Badge status={row.status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-400">Profit</p>
                    <p className={`text-lg font-bold flex items-center gap-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {formatRupees(row.profit)}
                    </p>
                    <p className="text-xs text-surface-400">{row.profit_margin.toFixed(1)}% margin</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-surface-100 text-xs">
                  <div>
                    <p className="text-surface-400 mb-0.5">Contract</p>
                    <p className="font-semibold text-surface-800">{formatRupees(row.contract_value)}</p>
                  </div>
                  <div>
                    <p className="text-surface-400 mb-0.5">Total Cost</p>
                    <p className="font-semibold text-surface-800">{formatRupees(row.total_cost)}</p>
                  </div>
                  <div>
                    <p className="text-surface-400 mb-0.5">Labour</p>
                    <p className="font-semibold text-surface-800">{formatRupees(row.labour_cost)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Labour Report */}
      {activeTab === 'labour' && labourQuery.data && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Worker</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase hidden sm:table-cell">Project</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Present</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase hidden sm:table-cell">Half</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Labour Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {labourQuery.data.map((row, i) => (
                <tr key={i} className="hover:bg-surface-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-surface-900">{row.worker_name}</p>
                    <p className="text-xs text-surface-400">{WORKER_TYPE_LABELS[row.worker_type]}</p>
                  </td>
                  <td className="px-4 py-3 text-surface-600 hidden sm:table-cell">{row.project_name}</td>
                  <td className="px-4 py-3 text-right text-surface-900 font-medium">{row.days_present}</td>
                  <td className="px-4 py-3 text-right text-surface-600 hidden sm:table-cell">{row.half_days}</td>
                  <td className="px-4 py-3 text-right font-bold text-surface-900">{formatRupees(row.total_labour_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {labourQuery.data.length === 0 && <div className="py-12 text-center text-sm text-surface-400">No data</div>}
        </div>
      )}

      {/* Expense Report */}
      {activeTab === 'expenses' && expenseQuery.data && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase hidden sm:table-cell">Project</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {expenseQuery.data.map(row => (
                <tr key={row.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 text-surface-600">{formatDate(row.date)}</td>
                  <td className="px-4 py-3 text-surface-600 hidden sm:table-cell">{row.project_name}</td>
                  <td className="px-4 py-3 font-medium text-surface-900">{EXPENSE_CATEGORY_LABELS[row.category] || row.category}</td>
                  <td className="px-4 py-3 text-right font-bold text-surface-900">{formatRupees(row.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenseQuery.data.length === 0 && <div className="py-12 text-center text-sm text-surface-400">No data</div>}
        </div>
      )}

      {/* Material Report */}
      {activeTab === 'materials' && materialQuery.data && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Material</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase hidden sm:table-cell">Project</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase hidden sm:table-cell">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {materialQuery.data.map(row => (
                <tr key={row.id} className="hover:bg-surface-50">
                  <td className="px-4 py-3 text-surface-600">{formatDate(row.purchase_date)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-surface-900">{row.material_name}</p>
                    <p className="text-xs text-surface-400">{row.quantity} {row.unit} × {formatRupees(row.unit_price)}</p>
                  </td>
                  <td className="px-4 py-3 text-surface-600 hidden sm:table-cell">{row.project_name}</td>
                  <td className="px-4 py-3 text-right font-bold text-surface-900">{formatRupees(row.total_amount)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell"><Badge status={row.payment_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {materialQuery.data.length === 0 && <div className="py-12 text-center text-sm text-surface-400">No data</div>}
        </div>
      )}
    </div>
  );
}

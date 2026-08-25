import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { expensesApi, projectsApi } from '../../api/client';
import { todayInputDate } from '../../utils';
import type { Project } from '../../types';

const CATEGORIES = [
  { value: 'transport', label: 'Transport' },
  { value: 'fuel', label: 'Fuel' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'tools', label: 'Tools' },
  { value: 'food', label: 'Food' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'labour_advance', label: 'Labour Advance' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

export default function ExpenseFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    project_id: searchParams.get('project') || '',
    date: todayInputDate(),
    category: 'transport',
    amount: '',
    description: '',
    payment_method: 'cash',
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data,
  });
  const projects: Project[] = projectsData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.project_id) { setError('Please select a project'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Amount must be greater than 0'); return; }

    setSaving(true);
    try {
      await expensesApi.create(form);
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/expenses');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg : (detail || 'Failed to save expense'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-surface-900">Add Expense</h1>
      </div>

      <div className="card p-5 lg:p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Project *</label>
            <select name="project_id" className="form-select" value={form.project_id} onChange={handleChange} required>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input name="amount" type="number" inputMode="decimal" className="form-input text-xl font-bold"
              placeholder="0" value={form.amount} onChange={handleChange} min="1" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Payment</label>
              <select name="payment_method" className="form-select" value={form.payment_method} onChange={handleChange}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input name="date" type="date" className="form-input" value={form.date} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Description <span className="text-surface-400 font-normal">(optional)</span></label>
            <input name="description" className="form-input" placeholder="What was this expense for?"
              value={form.description} onChange={handleChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

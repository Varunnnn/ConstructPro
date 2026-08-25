import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { projectsApi } from '../../api/client';
import { LoadingSpinner, UpgradeLimitModal } from '../../components/ui';
import { todayInputDate } from '../../utils';

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [limitModal, setLimitModal] = useState<{ open: boolean; code?: string; message?: string; plan?: string }>({ open: false });

  const [form, setForm] = useState({
    name: '', customer_name: '', customer_phone: '',
    site_address: '', contract_value: '', start_date: todayInputDate(),
    expected_end_date: '', status: 'planning', notes: ''
  });

  // Load for edit
  const { data: existingProject, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await projectsApi.get(id!);
      return res.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingProject) {
      setForm({
        name: existingProject.name || '',
        customer_name: existingProject.customer_name || '',
        customer_phone: existingProject.customer_phone || '',
        site_address: existingProject.site_address || '',
        contract_value: existingProject.contract_value || '',
        start_date: existingProject.start_date || todayInputDate(),
        expected_end_date: existingProject.expected_end_date || '',
        status: existingProject.status || 'planning',
        notes: existingProject.notes || '',
      });
    }
  }, [existingProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Project name is required'); return; }
    if (form.contract_value && parseFloat(form.contract_value) < 0) {
      setError('Contract value cannot be negative'); return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await projectsApi.update(id!, form);
      } else {
        await projectsApi.create(form);
      }
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', id] });
      navigate('/projects');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403 && detail?.code) {
        setLimitModal({ open: true, code: detail.code, message: detail.message, plan: detail.recommended_plan });
      } else {
        setError(Array.isArray(detail) ? detail[0]?.msg : (typeof detail === 'string' ? detail : detail?.message || 'Failed to save project'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  const limitErr = limitModal;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-surface-900">
          {isEdit ? 'Edit Project' : 'New Project'}
        </h1>
      </div>

      <div className="card p-5 lg:p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Project name *</label>
            <input name="name" className="form-input" placeholder="e.g. House #124" value={form.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Contract value (₹)</label>
            <input name="contract_value" type="number" inputMode="decimal" className="form-input"
              placeholder="0" value={form.contract_value} onChange={handleChange} min="0" />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select name="status" className="form-select" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="divider" />
          <p className="text-sm font-semibold text-surface-700">Customer Details</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Customer name</label>
              <input name="customer_name" className="form-input" placeholder="Sunil Mehta" value={form.customer_name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Customer phone</label>
              <input name="customer_phone" type="tel" inputMode="numeric" className="form-input" placeholder="98765 43210" value={form.customer_phone} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Site address</label>
            <input name="site_address" className="form-input" placeholder="Plot 124, Sector 45, Gurugram" value={form.site_address} onChange={handleChange} />
          </div>

          <div className="divider" />
          <p className="text-sm font-semibold text-surface-700">Timeline</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Start date</label>
              <input name="start_date" type="date" className="form-input" value={form.start_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Expected completion</label>
              <input name="expected_end_date" type="date" className="form-input" value={form.expected_end_date} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea name="notes" className="form-input resize-none" rows={3} placeholder="Any notes about this project..."
              value={form.notes} onChange={handleChange as any} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>

      <UpgradeLimitModal
        open={limitErr.open}
        onClose={() => setLimitModal({ open: false })}
        errorCode={limitErr.code}
        message={limitErr.message}
        recommendedPlan={limitErr.plan}
      />
    </div>
  );
}

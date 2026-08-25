import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { workersApi } from '../../api/client';
import { LoadingSpinner, UpgradeLimitModal } from '../../components/ui';
import { todayInputDate } from '../../utils';

const WORKER_TYPES = ['mason','helper','carpenter','electrician','plumber','painter','other'];
const TYPE_LABELS: Record<string,string> = {
  mason:'Mason', helper:'Helper', carpenter:'Carpenter', electrician:'Electrician',
  plumber:'Plumber', painter:'Painter', other:'Other'
};

export default function WorkerFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [limitModal, setLimitModal] = useState<{ open: boolean; code?: string; message?: string; plan?: string }>({ open: false });

  const [form, setForm] = useState({
    name: '', mobile: '', worker_type: 'helper',
    daily_wage: '', joining_date: todayInputDate(), status: 'active', notes: ''
  });

  const { data: existingWorker, isLoading } = useQuery({
    queryKey: ['worker', id],
    queryFn: async () => {
      const res = await workersApi.get(id!);
      return res.data.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingWorker) {
      setForm({
        name: existingWorker.name || '',
        mobile: existingWorker.mobile || '',
        worker_type: existingWorker.worker_type || 'helper',
        daily_wage: existingWorker.daily_wage || '',
        joining_date: existingWorker.joining_date || todayInputDate(),
        status: existingWorker.status || 'active',
        notes: existingWorker.notes || '',
      });
    }
  }, [existingWorker]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name) { setError('Worker name is required'); return; }
    if (form.daily_wage && parseFloat(form.daily_wage) < 0) { setError('Daily wage cannot be negative'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await workersApi.update(id!, form);
      } else {
        await workersApi.create(form);
      }
      qc.invalidateQueries({ queryKey: ['workers'] });
      navigate('/workers');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 403 && detail?.code) {
        setLimitModal({ open: true, code: detail.code, message: detail.message, plan: detail.recommended_plan });
      } else {
        setError(Array.isArray(detail) ? detail[0]?.msg : (typeof detail === 'string' ? detail : detail?.message || 'Failed to save worker'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-icon btn-secondary">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-bold text-surface-900">{isEdit ? 'Edit Worker' : 'Add Worker'}</h1>
      </div>

      <div className="card p-5 lg:p-6">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="form-label">Worker name *</label>
            <input name="name" className="form-input" placeholder="Ramesh Kumar" value={form.name} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Worker type</label>
              <select name="worker_type" className="form-select" value={form.worker_type} onChange={handleChange}>
                {WORKER_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Daily wage (₹)</label>
              <input name="daily_wage" type="number" inputMode="decimal" className="form-input"
                placeholder="800" value={form.daily_wage} onChange={handleChange} min="0" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mobile number</label>
            <input name="mobile" type="tel" inputMode="numeric" className="form-input"
              placeholder="98765 43210" value={form.mobile} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Joining date</label>
              <input name="joining_date" type="date" className="form-input" value={form.joining_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select name="status" className="form-select" value={form.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea name="notes" className="form-input resize-none" rows={2}
              placeholder="Any notes..." value={form.notes} onChange={handleChange as any} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Worker')}
            </button>
          </div>
        </form>
      </div>

      <UpgradeLimitModal
        open={limitModal.open}
        onClose={() => setLimitModal({ open: false })}
        errorCode={limitModal.code}
        message={limitModal.message}
        recommendedPlan={limitModal.plan}
      />
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Search, History } from 'lucide-react';
import { materialsApi, projectsApi, masterDataApi } from '../../api/client';
import { todayInputDate, formatRupees } from '../../utils';
import type { Project } from '../../types';

export default function MaterialFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [matSearch, setMatSearch] = useState('');
  const [selectedMatInfo, setSelectedMatInfo] = useState<any>(null);

  const [form, setForm] = useState({
    project_id: searchParams.get('project') || '',
    material_name: '',
    category: 'cement',
    quantity: '',
    unit: 'bags',
    unit_price: '',
    supplier: '',
    purchase_date: todayInputDate(),
    payment_status: 'paid',
    notes: '',
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data,
  });
  const projects: Project[] = projectsData?.data || [];

  // Master Data Search query (supports Hindi aliases like 'sariya', 'ret', 'eent', 'cement')
  const { data: searchResultsData } = useQuery({
    queryKey: ['master-materials-search', matSearch],
    queryFn: async () => (await masterDataApi.materials({ q: matSearch })).data,
    enabled: matSearch.length >= 2,
  });
  const searchedMaterials = searchResultsData?.data || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSelectMasterMaterial = (m: any) => {
    setSelectedMatInfo(m);
    setMatSearch(m.name);
    setForm(f => ({
      ...f,
      material_name: m.name,
      unit: m.primary_unit_code ? m.primary_unit_code.toLowerCase() : f.unit,
      unit_price: m.last_purchase_price ? m.last_purchase_price : f.unit_price,
      supplier: m.last_supplier ? m.last_supplier : f.supplier,
    }));
  };

  const total = form.quantity && form.unit_price
    ? (parseFloat(form.quantity) * parseFloat(form.unit_price)).toFixed(2)
    : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.project_id) { setError('Please select a project'); return; }
    if (!form.material_name) { setError('Material name is required'); return; }
    if (!form.quantity || parseFloat(form.quantity) <= 0) { setError('Quantity must be greater than 0'); return; }
    if (!form.unit_price || parseFloat(form.unit_price) < 0) { setError('Unit price cannot be negative'); return; }

    setSaving(true);
    try {
      await materialsApi.create(form);
      qc.invalidateQueries({ queryKey: ['materials'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/materials');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg : (detail || 'Failed to save material'));
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
        <h1 className="text-xl font-bold text-surface-900">Add Material</h1>
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

          {/* Master Material Smart Search */}
          <div className="form-group relative">
            <label className="form-label">Search Construction Material Master</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                className="form-input pl-9"
                placeholder="Type 'cement', 'sariya', 'ret', 'eent'..."
                value={matSearch}
                onChange={e => {
                  setMatSearch(e.target.value);
                  setForm(f => ({ ...f, material_name: e.target.value }));
                }}
                required
              />
            </div>

            {searchedMaterials.length > 0 && matSearch !== form.material_name && (
              <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-surface-200 rounded-xl shadow-modal max-h-48 overflow-y-auto divide-y divide-surface-100">
                {searchedMaterials.map((m: any) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMasterMaterial(m)}
                    className="w-full text-left px-4 py-2.5 hover:bg-surface-50 transition-colors flex flex-col"
                  >
                    <span className="text-sm font-semibold text-surface-900">{m.name}</span>
                    {m.brand_examples && <span className="text-xs text-surface-400">{m.brand_examples}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Last Purchase History Memory Badge */}
          {selectedMatInfo?.last_purchase_price && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
              <History className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Last Purchased: {formatRupees(selectedMatInfo.last_purchase_price)} / {selectedMatInfo.primary_unit_code}</p>
                <p className="text-blue-600 mt-0.5">Supplier: {selectedMatInfo.last_supplier || 'Unknown'} ({selectedMatInfo.last_purchase_date})</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input name="quantity" type="number" inputMode="decimal" className="form-input"
                placeholder="50" value={form.quantity} onChange={handleChange} min="0.001" step="any" required />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input name="unit" className="form-input" placeholder="bags, kg, tonnes" value={form.unit} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Unit price (₹) *</label>
            <input name="unit_price" type="number" inputMode="decimal" className="form-input"
              placeholder="390" value={form.unit_price} onChange={handleChange} min="0" step="any" required />
          </div>

          {/* Auto total */}
          {form.quantity && form.unit_price && (
            <div className="bg-brand-50 border border-brand-200 rounded-lg px-4 py-3">
              <p className="text-xs text-brand-600 font-medium">Total Amount</p>
              <p className="text-xl font-bold text-brand-700">
                ₹{parseFloat(total).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-brand-500">{form.quantity} × ₹{form.unit_price}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Date</label>
              <input name="purchase_date" type="date" className="form-input" value={form.purchase_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment status</label>
              <select name="payment_status" className="form-select" value={form.payment_status} onChange={handleChange}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Supplier <span className="text-surface-400 font-normal">(optional)</span></label>
            <input name="supplier" className="form-input" placeholder="Ramesh Traders" value={form.supplier} onChange={handleChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

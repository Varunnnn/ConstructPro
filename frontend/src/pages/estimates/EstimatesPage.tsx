import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Calculator, Printer } from 'lucide-react';
import { estimatesApi, projectsApi, clientsApi } from '../../api/client';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { formatRupees } from '../../utils';

export default function EstimatesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [boqItems, setBoqItems] = useState([
    { description: 'Foundation & Earthwork Excavation', quantity: 1200, unit: 'CFT', rate: 45, amount: 54000 },
    { description: 'RCC Slab & Column Concrete (M20 Grade)', quantity: 450, unit: 'CFT', rate: 380, amount: 171000 },
    { description: 'First Class Brickwork in Cement Mortar (1:6)', quantity: 850, unit: 'CFT', rate: 160, amount: 136000 },
  ]);
  const [taxRate] = useState(18);
  const [creating, setCreating] = useState(false);

  const { data: estData, isLoading } = useQuery({
    queryKey: ['estimates'],
    queryFn: async () => (await estimatesApi.list()).data.data,
  });

  const { data: projData } = useQuery({
    queryKey: ['projects-list-estimates'],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data.data,
  });

  const { data: clientData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await clientsApi.list()).data.data,
  });

  const estimates = estData || [];
  const projects = projData || [];
  const clients = clientData || [];

  const handleAddItem = () => {
    setBoqItems([...boqItems, { description: '', quantity: 1, unit: 'NOS', rate: 0, amount: 0 }]);
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    const updated = boqItems.map((item, i) => {
      if (i !== index) return item;
      const updated_item = { ...item, [field]: val };
      if (field === 'quantity' || field === 'rate') {
        updated_item.amount = (Number(updated_item.quantity) || 0) * (Number(updated_item.rate) || 0);
      }
      return updated_item;
    });
    setBoqItems(updated);
  };

  const calculateSubtotal = () => boqItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const calculateTax = () => Math.round((calculateSubtotal() * taxRate) / 100);
  const calculateGrandTotal = () => calculateSubtotal() + calculateTax();

  const handleSaveEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Please enter Estimate Title');
    setCreating(true);
    try {
      await estimatesApi.create({
        title,
        project_id: projectId || undefined,
        client_id: clientId || undefined,
        total_amount: calculateSubtotal(),
        tax_amount: calculateTax(),
        boq_items: boqItems,
        notes: '',
      });
      qc.invalidateQueries({ queryKey: ['estimates'] });
      setShowModal(false);
      setTitle('');
      setBoqItems([
        { description: '', quantity: 1, unit: 'NOS', rate: 0, amount: 0 },
      ]);
      alert('Estimate / BOQ Quotation created successfully!');
    } catch {
      alert('Failed to save estimate. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handlePrint = (est: any) => {
    const boqRows = (Array.isArray(est.boq_json) ? est.boq_json : [])
      .map((item: any, idx: number) =>
        `<tr>
          <td>${idx + 1}</td>
          <td>${item.description || ''}</td>
          <td style="text-align:right">${item.quantity || 0}</td>
          <td style="text-align:right">${item.unit || ''}</td>
          <td style="text-align:right">&#8377;${Number(item.rate || 0).toLocaleString()}</td>
          <td style="text-align:right"><b>&#8377;${Number(item.amount || 0).toLocaleString()}</b></td>
        </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Quotation - ${est.estimate_number}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; font-size: 13px; }
    th { background: #f4f4f5; font-weight: bold; }
    .totals { margin-top: 30px; width: 300px; float: right; }
    .totals div { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
    .total-row { border-top: 2px solid #000; font-size: 16px; font-weight: bold; padding-top: 8px !important; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 style="margin:0">ConstructPro Quotation</h2>
      <p style="margin:4px 0 0 0; color:#555;">Bill of Quantities &amp; Estimate</p>
    </div>
    <div style="text-align:right">
      <h3 style="margin:0">${est.estimate_number}</h3>
      <p style="margin:4px 0 0 0">Date: ${est.date || ''}</p>
      <p style="margin:4px 0 0 0">Valid Until: ${est.valid_until || ''}</p>
    </div>
  </div>
  <h3>${est.title}</h3>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Description of Work / Materials</th>
        <th style="text-align:right">Qty</th>
        <th style="text-align:right">Unit</th>
        <th style="text-align:right">Rate (&#8377;)</th>
        <th style="text-align:right">Amount (&#8377;)</th>
      </tr>
    </thead>
    <tbody>${boqRows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal:</span><span>&#8377;${Number(est.total_amount).toLocaleString()}</span></div>
    <div><span>GST (18%):</span><span>&#8377;${Number(est.tax_amount).toLocaleString()}</span></div>
    <div class="total-row"><span>Grand Total:</span><span>&#8377;${Number(est.grand_total).toLocaleString()}</span></div>
  </div>
  <script>window.onload = function(){ window.print(); }</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div>
      <PageHeader
        title="Estimates & BOQ Generator"
        subtitle="Create itemized Bill of Quantities and formal client quotations"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create Estimate / BOQ
          </button>
        }
      />

      {isLoading && <LoadingSpinner />}

      {!isLoading && estimates.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-900">
            <Calculator className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">No Estimates Created Yet</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Generate itemized BOQs with material rates, labour costs, and GST tax breakdowns.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Create First Estimate
          </button>
        </div>
      )}

      {estimates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estimates.map((est: any) => (
            <div key={est.id} className="card p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-mono font-bold">
                    {est.estimate_number}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    est.status === 'accepted' ? 'bg-green-100 text-green-700' :
                    est.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {est.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-neutral-900 mb-1 leading-snug">{est.title}</h3>
                <p className="text-xs text-neutral-400 mb-3">
                  {Array.isArray(est.boq_json) ? est.boq_json.length : 0} BOQ line items · Valid until {est.valid_until || 'N/A'}
                </p>
                <div className="p-3 bg-neutral-50 rounded-xl space-y-1">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Subtotal</span>
                    <span>{formatRupees(Number(est.total_amount))}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>GST (18%)</span>
                    <span>{formatRupees(Number(est.tax_amount))}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-neutral-900 border-t border-neutral-200 pt-1.5 mt-1.5">
                    <span>Grand Total</span>
                    <span>{formatRupees(Number(est.grand_total))}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handlePrint(est)}
                className="w-full btn-secondary text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Export Quotation PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE MODAL ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-neutral-900">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 text-xl font-bold leading-none"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-1">Create BOQ Estimate &amp; Quotation</h2>
            <p className="text-sm text-neutral-500 mb-5">Fill in the details and add line items below.</p>

            <form onSubmit={handleSaveEstimate} className="space-y-5">

              {/* Title */}
              <div>
                <label className="form-label">Quotation Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3BHK Villa Construction — Phase 1 Estimate"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Project + Client */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Project (Optional)</label>
                  <select className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
                    <option value="">Select Project...</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Client (Optional)</label>
                  <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)}>
                    <option value="">Select Client...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BOQ Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label mb-0 font-bold">BOQ Line Items</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-neutral-900 underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>

                {/* Header labels */}
                <div className="grid grid-cols-12 gap-2 mb-1 px-2.5 text-xs font-bold text-neutral-400 uppercase tracking-wide">
                  <span className="col-span-5">Description</span>
                  <span className="col-span-2 text-right">Qty</span>
                  <span className="col-span-2">Unit</span>
                  <span className="col-span-2 text-right">Rate (₹)</span>
                  <span className="col-span-1 text-right">Amt</span>
                </div>

                <div className="space-y-2">
                  {boqItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-neutral-50 p-2.5 rounded-xl items-center"
                    >
                      <input
                        type="text"
                        placeholder="Item description..."
                        className="col-span-5 form-input text-xs py-1.5"
                        value={item.description}
                        onChange={e => handleUpdateItem(idx, 'description', e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="col-span-2 form-input text-xs py-1.5"
                        value={item.quantity}
                        onChange={e => handleUpdateItem(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="SFT"
                        className="col-span-2 form-input text-xs py-1.5"
                        value={item.unit}
                        onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="col-span-2 form-input text-xs py-1.5"
                        value={item.rate}
                        onChange={e => handleUpdateItem(idx, 'rate', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setBoqItems(boqItems.filter((_, i) => i !== idx))}
                        className="col-span-1 text-neutral-300 hover:text-red-500 font-bold text-center text-base leading-none"
                        title="Remove row"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand Total Summary */}
              <div className="p-4 bg-neutral-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-bold mb-0.5">Grand Total (incl. 18% GST)</p>
                  <p className="text-2xl font-black">{formatRupees(calculateGrandTotal())}</p>
                </div>
                <div className="text-right text-xs text-neutral-300 space-y-0.5">
                  <p>Subtotal: {formatRupees(calculateSubtotal())}</p>
                  <p>GST 18%: {formatRupees(calculateTax())}</p>
                  <p className="text-neutral-400">{boqItems.length} items</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full btn-primary btn-lg"
              >
                {creating ? 'Saving Estimate...' : 'Save & Generate Quotation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

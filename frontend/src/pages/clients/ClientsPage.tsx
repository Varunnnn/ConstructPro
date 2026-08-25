import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Receipt, Printer, Mail, Phone, Building2 } from 'lucide-react';
import { clientsApi, clientInvoicesApi, projectsApi } from '../../api/client';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { formatRupees, formatDate } from '../../utils';

export default function ClientsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'clients' | 'invoices'>('clients');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Client form
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address] = useState('');
  const [gstin, setGstin] = useState('');

  // Invoice form
  const [projectId, setProjectId] = useState('');
  const [clientId, setClientId] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate] = useState(18);
  const [dueDate, setDueDate] = useState('');

  const [saving, setSaving] = useState(false);

  const { data: cData, isLoading: cLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => (await clientsApi.list()).data.data,
  });

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: async () => (await clientInvoicesApi.list()).data.data,
  });

  const { data: projData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data.data,
  });

  const clients = cData || [];
  const invoices = invData || [];
  const projects = projData || [];

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return alert('Please enter client name');
    setSaving(true);
    try {
      await clientsApi.create({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        company_name: companyName,
        address,
        gstin,
      });
      qc.invalidateQueries({ queryKey: ['clients'] });
      setShowClientModal(false);
      setClientName('');
      setClientEmail('');
      setClientPhone('');
      alert('🎉 Client saved to directory!');
    } catch (err) {
      alert('Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !milestoneName || !amount) return alert('Please fill in required fields');
    setSaving(true);
    const numAmount = parseFloat(amount) || 0;
    const taxAmount = (numAmount * taxRate) / 100;
    try {
      await clientInvoicesApi.create({
        project_id: projectId,
        client_id: clientId || undefined,
        milestone_name: milestoneName,
        amount: numAmount,
        tax_amount: taxAmount,
        due_date: dueDate || new Date().toISOString().split('T')[0],
        issue_date: new Date().toISOString().split('T')[0],
      });
      qc.invalidateQueries({ queryKey: ['client-invoices'] });
      setShowInvoiceModal(false);
      setMilestoneName('');
      setAmount('');
      alert('🎉 Client Milestone Invoice generated!');
    } catch (err) {
      alert('Failed to generate invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clients & Progress Milestone Billing"
        subtitle="Manage client contacts and issue milestone-based project progress invoices"
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowClientModal(true)} className="btn-secondary text-xs">
              <Plus className="w-4 h-4" /> Add Client
            </button>

            <button onClick={() => setShowInvoiceModal(true)} className="btn-primary text-xs">
              <Receipt className="w-4 h-4" /> Issue Milestone Invoice
            </button>
          </div>
        }
      />

      {/* TABS */}
      <div className="flex gap-2 border-b border-neutral-200 mb-6">
        <button
          onClick={() => setActiveTab('clients')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'clients' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Client Directory ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${
            activeTab === 'invoices' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Progress Milestone Invoices ({invoices.length})
        </button>
      </div>

      {activeTab === 'clients' && (
        <>
          {cLoading && <LoadingSpinner />}
          {!cLoading && clients.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-900">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">No Clients Added Yet</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
                Store client contact profiles, GSTIN details, and billing addresses.
              </p>
              <button onClick={() => setShowClientModal(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Add First Client
              </button>
            </div>
          )}

          {clients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((c: any) => (
                <div key={c.id} className="card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white font-bold flex items-center justify-center text-lg">
                      {c.name[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-neutral-900">{c.name}</h3>
                      <p className="text-xs text-neutral-500">{c.company_name || 'Individual Client'}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl">
                    {c.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> <span>{c.email}</span></div>}
                    {c.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> <span>{c.phone}</span></div>}
                    {c.gstin && <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> <span>GSTIN: {c.gstin}</span></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'invoices' && (
        <>
          {invLoading && <LoadingSpinner />}
          {!invLoading && invoices.length === 0 && (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-900">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">No Client Invoices Issued Yet</h3>
              <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
                Issue milestone billing invoices (Plinth level, Slab completion, Finishing phase) to your clients.
              </p>
              <button onClick={() => setShowInvoiceModal(true)} className="btn-primary">
                <Receipt className="w-4 h-4" /> Issue First Milestone Invoice
              </button>
            </div>
          )}

          {invoices.length > 0 && (
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-bold text-neutral-500 uppercase text-left">
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Milestone</th>
                    <th className="p-3.5">Issue Date</th>
                    <th className="p-3.5 text-right">Base Amount</th>
                    <th className="p-3.5 text-right">GST (18%)</th>
                    <th className="p-3.5 text-right">Total Amount</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-neutral-50">
                      <td className="p-3.5 font-bold font-mono text-neutral-900">{inv.invoice_number}</td>
                      <td className="p-3.5 font-medium text-neutral-800">{inv.milestone_name}</td>
                      <td className="p-3.5 text-neutral-500">{formatDate(inv.issue_date)}</td>
                      <td className="p-3.5 text-right font-medium text-neutral-700">{formatRupees(inv.amount)}</td>
                      <td className="p-3.5 text-right text-neutral-500">{formatRupees(inv.tax_amount)}</td>
                      <td className="p-3.5 text-right font-bold text-neutral-900">{formatRupees(inv.total_amount)}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            const win = window.open('', '_blank');
                            if (win) {
                              win.document.write(`
                                <html>
                                  <head>
                                    <title>Invoice - ${inv.invoice_number}</title>
                                    <style>
                                      body { font-family: sans-serif; padding: 40px; color: #111; }
                                      .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
                                      .box { margin-top: 25px; border: 1px solid #ccc; padding: 20px; border-radius: 8px; }
                                      table { width: 100%; margin-top: 20px; border-collapse: collapse; }
                                      th, td { padding: 10px; border-bottom: 1px solid #eee; text-align: left; }
                                      .text-right { text-align: right; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="header">
                                      <div>
                                        <h2>ConstructPro Contractor Invoice</h2>
                                        <p>Client Progress Milestone Invoice</p>
                                      </div>
                                      <div style="text-align: right;">
                                        <h3>${inv.invoice_number}</h3>
                                        <p>Date: ${inv.issue_date}</p>
                                      </div>
                                    </div>
                                    <div class="box">
                                      <h3>Milestone: ${inv.milestone_name}</h3>
                                      <table>
                                        <thead>
                                          <tr>
                                            <th>Description</th>
                                            <th class="text-right">Amount</th>
                                            <th class="text-right">GST (18%)</th>
                                            <th class="text-right">Total Payable</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td>${inv.milestone_name}</td>
                                            <td class="text-right">₹${inv.amount}</td>
                                            <td class="text-right">₹${inv.tax_amount}</td>
                                            <td class="text-right"><b>₹${inv.total_amount}</b></td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                    <script>window.onload = function() { window.print(); }</script>
                                  </body>
                                </html>
                              `);
                              win.document.close();
                            }
                          }}
                          className="btn-secondary text-xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-neutral-900">
            <button onClick={() => setShowClientModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Add Client Profile</h2>
            <form onSubmit={handleSaveClient} className="space-y-3">
              <div>
                <label className="form-label">Client Name *</label>
                <input type="text" required placeholder="e.g. Sunil Mehta" value={clientName} onChange={e => setClientName(e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Company Name</label>
                <input type="text" placeholder="e.g. Mehta Developers Pvt Ltd" value={companyName} onChange={e => setCompanyName(e.target.value)} className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Phone</label>
                  <input type="text" placeholder="9812345678" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" placeholder="client@email.com" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">GSTIN Number</label>
                <input type="text" placeholder="07AAAAA0000A1Z5" value={gstin} onChange={e => setGstin(e.target.value)} className="form-input" />
              </div>
              <button type="submit" disabled={saving} className="w-full btn-primary btn-lg mt-2">
                {saving ? 'Saving...' : 'Save Client Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-neutral-900">
            <button onClick={() => setShowInvoiceModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            <h2 className="text-lg font-bold mb-4">Issue Progress Milestone Invoice</h2>
            <form onSubmit={handleSaveInvoice} className="space-y-3">
              <div>
                <label className="form-label">Select Project *</label>
                <select required className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
                  <option value="">Select Project...</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Select Client (Optional)</label>
                <select className="form-select" value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Select Client...</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Milestone Name *</label>
                <input type="text" required placeholder="e.g. Plinth Level Completion (20% Milestone)" value={milestoneName} onChange={e => setMilestoneName(e.target.value)} className="form-input" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Milestone Amount (₹) *</label>
                  <input type="number" required placeholder="500000" value={amount} onChange={e => setAmount(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full btn-primary btn-lg mt-2">
                {saving ? 'Generating...' : 'Generate & Issue Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

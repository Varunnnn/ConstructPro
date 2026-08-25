import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Download } from 'lucide-react';
import { billingApi } from '../../api/client';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { formatRupees, formatDate } from '../../utils';

export default function CustomerBillingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => (await billingApi.getSubscription()).data.data,
  });

  const { data: invData } = useQuery({
    queryKey: ['customer-invoices'],
    queryFn: async () => (await billingApi.getInvoices()).data.data,
  });

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription renewal?')) return;
    try {
      await billingApi.cancel();
      qc.invalidateQueries({ queryKey: ['subscription'] });
      alert('Subscription cancellation scheduled.');
    } catch (err) {
      alert('Failed to cancel subscription.');
    }
  };

  const handleReactivate = async () => {
    try {
      await billingApi.reactivate();
      qc.invalidateQueries({ queryKey: ['subscription'] });
      alert('Subscription reactivated!');
    } catch (err) {
      alert('Failed to reactivate.');
    }
  };

  if (subLoading) return <LoadingSpinner />;

  const plan = subData?.plan;
  const usage = subData?.usage;
  const invoices = invData || [];

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Subscription & Billing"
        subtitle="Manage your ConstructPro SaaS subscription, usage limits, and invoices."
      />

      {/* Current Plan Summary Card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-surface-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-surface-900">{plan?.name} Plan</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                subData?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                subData?.status === 'TRIALING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                {subData?.status}
              </span>
            </div>
            <p className="text-sm text-surface-500 mt-1">
              Billing Cycle: <span className="font-semibold">{subData?.billing_cycle}</span>
              {subData?.trial_ends_at && subData?.status === 'TRIALING' && (
                <span> · Trial Ends: {formatDate(subData.trial_ends_at)} ({subData.trial_days_remaining} days left)</span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate('/pricing')} className="btn-primary">
              <ArrowUpRight className="w-4 h-4" /> Change Plan
            </button>
            {subData?.cancel_at_period_end ? (
              <button onClick={handleReactivate} className="btn-secondary text-green-600">
                Reactivate
              </button>
            ) : (
              subData?.status === 'ACTIVE' && (
                <button onClick={handleCancel} className="btn-secondary text-red-600">
                  Cancel Renewal
                </button>
              )
            )}
          </div>
        </div>

        {/* Plan Usage Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Projects usage */}
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Active Projects</p>
            <div className="flex items-baseline justify-between mt-2 mb-1">
              <span className="text-xl font-extrabold text-surface-900">{usage?.projects?.current}</span>
              <span className="text-xs text-surface-500">Limit: {usage?.projects?.unlimited ? 'Unlimited' : usage?.projects?.limit}</span>
            </div>
            {!usage?.projects?.unlimited && (
              <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all"
                  style={{ width: `${Math.min(100, (usage?.projects?.current / usage?.projects?.limit) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Workers usage */}
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Active Workers</p>
            <div className="flex items-baseline justify-between mt-2 mb-1">
              <span className="text-xl font-extrabold text-surface-900">{usage?.workers?.current}</span>
              <span className="text-xs text-surface-500">Limit: {usage?.workers?.unlimited ? 'Unlimited' : usage?.workers?.limit}</span>
            </div>
            {!usage?.workers?.unlimited && (
              <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-600 h-full transition-all"
                  style={{ width: `${Math.min(100, (usage?.workers?.current / usage?.workers?.limit) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Users usage */}
          <div className="bg-surface-50 rounded-xl p-4">
            <p className="text-xs font-bold text-surface-500 uppercase tracking-wide">Team Users</p>
            <div className="flex items-baseline justify-between mt-2 mb-1">
              <span className="text-xl font-extrabold text-surface-900">{usage?.users?.current}</span>
              <span className="text-xs text-surface-500">Limit: {usage?.users?.limit}</span>
            </div>
            <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full transition-all"
                style={{ width: `${Math.min(100, (usage?.users?.current / usage?.users?.limit) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="card p-6">
        <h3 className="text-base font-bold text-surface-900 mb-4">Payment Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-sm text-surface-400">No payment invoices generated yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100 text-left text-xs text-surface-500 uppercase">
                  <th className="pb-3">Invoice Number</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3 text-right">GST (18%)</th>
                  <th className="pb-3 text-right">Total</th>
                  <th className="pb-3 text-right">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-semibold text-surface-900">{inv.invoice_number}</td>
                    <td className="py-3 text-surface-500">{formatDate(inv.invoice_date)}</td>
                    <td className="py-3 text-right text-surface-700">{formatRupees(inv.amount)}</td>
                    <td className="py-3 text-right text-surface-500">{formatRupees(inv.tax_amount)}</td>
                    <td className="py-3 text-right font-bold text-surface-900">{formatRupees(inv.total_amount)}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 bg-neutral-900 text-white text-xs font-bold rounded">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => {
                          const win = window.open('', '_blank');
                          if (win) {
                            win.document.write(`
                              <html>
                                <head>
                                  <title>Receipt - ${inv.invoice_number}</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #111; }
                                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
                                    .title { font-size: 24px; font-weight: 900; }
                                    .box { margin-top: 30px; border: 1px solid #ccc; border-radius: 8px; padding: 20px; }
                                    table { width: 100%; margin-top: 20px; border-collapse: collapse; }
                                    th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                                    th { background: #f9f9f9; }
                                    .text-right { text-align: right; }
                                    .total { font-size: 18px; font-weight: bold; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <div>
                                      <div class="title">ConstructPro</div>
                                      <p>ConstructPro Technologies Ltd.<br/>GSTIN: 07AAAAA0000A1Z5</p>
                                    </div>
                                    <div style="text-align: right;">
                                      <h2>TAX INVOICE / RECEIPT</h2>
                                      <p><b>Invoice #:</b> ${inv.invoice_number}<br/><b>Date:</b> ${new Date(inv.invoice_date).toLocaleDateString()}</p>
                                    </div>
                                  </div>
                                  <div class="box">
                                    <h3>Subscription Receipt</h3>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Description</th>
                                          <th class="text-right">Base Amount</th>
                                          <th class="text-right">GST (18%)</th>
                                          <th class="text-right">Total Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td>ConstructPro Subscription Renewal</td>
                                          <td class="text-right">₹${Number(inv.amount).toFixed(2)}</td>
                                          <td class="text-right">₹${Number(inv.tax_amount).toFixed(2)}</td>
                                          <td class="text-right"><b>₹${Number(inv.total_amount).toFixed(2)}</b></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <div style="margin-top: 30px; text-align: right;" class="total">
                                      Status: <span style="color: green;">${inv.status}</span>
                                    </div>
                                  </div>
                                  <script>window.onload = function() { window.print(); }</script>
                                </body>
                              </html>
                            `);
                            win.document.close();
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-900 inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

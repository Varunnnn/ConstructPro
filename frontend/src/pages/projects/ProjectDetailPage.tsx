import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Users, Plus } from 'lucide-react';
import { projectsApi } from '../../api/client';
import { LoadingSpinner, ErrorMessage, Badge, ConfirmDialog } from '../../components/ui';
import { formatRupees, formatDate, WORKER_TYPE_LABELS } from '../../utils';
import type { Project, ProjectWorker } from '../../types';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => (await projectsApi.get(id!)).data.data,
    enabled: !!id,
  });

  const { data: projectWorkers = [] } = useQuery<ProjectWorker[]>({
    queryKey: ['project-workers', id],
    queryFn: async () => (await projectsApi.getWorkers(id!)).data.data,
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (error || !project) return <ErrorMessage message="Project not found." />;

  const fin = project.financials;
  const profit = fin ? parseFloat(fin.profit) : 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/projects')} className="btn-icon btn-secondary mt-0.5">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-surface-900">{project.name}</h1>
            <Badge status={project.status} />
          </div>
          {project.customer_name && (
            <p className="text-sm text-surface-500 mt-0.5">{project.customer_name} · {project.site_address}</p>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => navigate(`/projects/${id}/edit`)} className="btn-secondary btn-sm">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => setDeleteOpen(true)} className="btn-danger btn-sm">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      {fin && (
        <div className="card p-5 mb-5">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">Financial Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="fin-label mb-1">Contract Value</p>
              <p className="text-xl font-bold text-surface-900">{formatRupees(fin.contract_value)}</p>
            </div>
            <div>
              <p className="fin-label mb-1">Total Cost</p>
              <p className="text-xl font-bold text-surface-900">{formatRupees(fin.total_cost)}</p>
            </div>
            <div>
              <p className="fin-label mb-1">Estimated Profit</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatRupees(fin.profit)}
              </p>
            </div>
            <div>
              <p className="fin-label mb-1">Profit Margin</p>
              <p className={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {fin.profit_margin.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-surface-100">
            <div className="text-center">
              <p className="fin-label mb-1">Labour</p>
              <p className="text-base font-bold text-surface-800">{formatRupees(fin.labour_cost)}</p>
            </div>
            <div className="text-center">
              <p className="fin-label mb-1">Materials</p>
              <p className="text-base font-bold text-surface-800">{formatRupees(fin.material_cost)}</p>
            </div>
            <div className="text-center">
              <p className="fin-label mb-1">Expenses</p>
              <p className="text-base font-bold text-surface-800">{formatRupees(fin.other_expenses)}</p>
            </div>
          </div>

          {/* Budget used bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-surface-500 mb-1.5">
              <span>Budget used</span>
              <span>{Math.min(fin.budget_used_pct, 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${fin.budget_used_pct > 90 ? 'bg-red-500' : fin.budget_used_pct > 70 ? 'bg-orange-500' : 'bg-brand-500'}`}
                style={{ width: `${Math.min(fin.budget_used_pct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Project Info */}
      <div className="card p-5 mb-5">
        <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide mb-4">Project Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-surface-400 text-xs mb-0.5">Start Date</p>
            <p className="text-surface-800 font-medium">{formatDate(project.start_date)}</p>
          </div>
          <div>
            <p className="text-surface-400 text-xs mb-0.5">Expected Completion</p>
            <p className="text-surface-800 font-medium">{formatDate(project.expected_end_date)}</p>
          </div>
          <div>
            <p className="text-surface-400 text-xs mb-0.5">Customer Phone</p>
            <p className="text-surface-800 font-medium">{project.customer_phone || '—'}</p>
          </div>
          <div>
            <p className="text-surface-400 text-xs mb-0.5">Workers</p>
            <p className="text-surface-800 font-medium">{project.worker_count || 0} assigned</p>
          </div>
          {project.notes && (
            <div className="col-span-2">
              <p className="text-surface-400 text-xs mb-0.5">Notes</p>
              <p className="text-surface-800">{project.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Workers */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wide">Project Team</h2>
          <button onClick={() => navigate(`/projects/${id}/assign-worker`)} className="btn-secondary btn-sm">
            <Plus className="w-3.5 h-3.5" /> Add Worker
          </button>
        </div>
        {projectWorkers.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-4">No workers assigned yet</p>
        ) : (
          <div className="space-y-2">
            {projectWorkers.map(pw => (
              <div key={pw.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-brand-700">{pw.worker.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-surface-900">{pw.worker.name}</p>
                  <p className="text-xs text-surface-400">{WORKER_TYPE_LABELS[pw.worker.worker_type]} · {formatRupees(pw.worker.daily_wage)}/day</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate(`/attendance?project=${id}`)} className="btn-secondary">
          <Users className="w-4 h-4" /> Mark Attendance
        </button>
        <button onClick={() => navigate(`/expenses/new?project=${id}`)} className="btn-secondary">
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

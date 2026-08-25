import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { projectsApi, workersApi } from '../../api/client';
import { WORKER_TYPE_LABELS, formatRupees } from '../../utils';
import type { Worker } from '../../types';

export default function AssignWorkerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Get project from URL path
  const pathParts = window.location.pathname.split('/');
  const projectId = pathParts[2];

  const { data: projectWorkersData } = useQuery({
    queryKey: ['project-workers', projectId],
    queryFn: async () => (await projectsApi.getWorkers(projectId)).data.data,
    enabled: !!projectId,
  });
  const assignedIds = new Set((projectWorkersData || []).map((pw: any) => pw.worker.id));

  const { data: workersData } = useQuery({
    queryKey: ['workers', { statusFilter: 'active' }],
    queryFn: async () => (await workersApi.list({ status: 'active', per_page: 100 })).data,
  });
  const workers: Worker[] = (workersData?.data || []).filter((w: Worker) => !assignedIds.has(w.id));

  const handleAssign = async (workerId: string) => {
    setSaving(true);
    setError('');
    try {
      await projectsApi.assignWorker(projectId, { worker_id: workerId });
      qc.invalidateQueries({ queryKey: ['project-workers', projectId] });
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to assign worker');
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
        <h1 className="text-xl font-bold text-surface-900">Assign Workers</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}

      {workers.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-surface-500 text-sm">All active workers are already assigned to this project.</p>
        </div>
      )}

      <div className="space-y-3">
        {workers.map(w => (
          <div key={w.id} className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-brand-700">{w.name[0]}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-surface-900">{w.name}</p>
              <p className="text-xs text-surface-400">{WORKER_TYPE_LABELS[w.worker_type]} · {formatRupees(w.daily_wage)}/day</p>
            </div>
            <button
              onClick={() => handleAssign(w.id)}
              disabled={saving}
              className="btn-primary btn-sm"
            >
              Assign
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

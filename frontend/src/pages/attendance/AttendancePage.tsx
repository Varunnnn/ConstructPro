import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { projectsApi, attendanceApi } from '../../api/client';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { formatRupees, todayInputDate, WORKER_TYPE_LABELS } from '../../utils';
import type { Project, AttendanceStatus } from '../../types';

type WorkerAttState = { worker_id: string; worker_name: string; worker_type: string; daily_wage: string; status: AttendanceStatus };

export default function AttendancePage() {
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || '');
  const [selectedDate, setSelectedDate] = useState(todayInputDate());
  const [workerStates, setWorkerStates] = useState<WorkerAttState[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load projects for selector
  const { data: projectsData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ status: 'active', per_page: 100 })).data,
  });
  const projects: Project[] = projectsData?.data || [];

  // Load attendance for selected project + date
  const { data: attData, isLoading: attLoading } = useQuery({
    queryKey: ['attendance-by-date', selectedProject, selectedDate],
    queryFn: async () => (await attendanceApi.getByProjectDate(selectedProject, selectedDate)).data.data,
    enabled: !!selectedProject && !!selectedDate,
  });

  useEffect(() => {
    if (attData) {
      setWorkerStates(
        attData.map((r: any) => ({
          worker_id: r.worker_id,
          worker_name: r.worker_name,
          worker_type: r.worker_type,
          daily_wage: r.daily_wage,
          status: r.status as AttendanceStatus,
        }))
      );
      setSaved(false);
    }
  }, [attData]);

  const setStatus = (workerId: string, status: AttendanceStatus) => {
    setSaved(false);
    setWorkerStates(prev => prev.map(w => w.worker_id === workerId ? { ...w, status } : w));
  };

  const handleSave = async () => {
    if (!selectedProject || workerStates.length === 0) return;
    setSaving(true);
    try {
      await attendanceApi.bulkSave({
        project_id: selectedProject,
        date: selectedDate,
        records: workerStates.map(w => ({ worker_id: w.worker_id, status: w.status })),
      });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const totalLabour = workerStates.reduce((sum, w) => {
    const wage = parseFloat(w.daily_wage);
    if (w.status === 'present') return sum + wage;
    if (w.status === 'half_day') return sum + wage / 2;
    return sum;
  }, 0);

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark daily attendance" />

      {/* Selector row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="form-group">
          <label className="form-label">Project</label>
          <select
            className="form-select"
            value={selectedProject}
            onChange={e => { setSelectedProject(e.target.value); setSaved(false); }}
          >
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={e => { setSelectedDate(e.target.value); setSaved(false); }}
          />
        </div>
      </div>

      {!selectedProject && (
        <div className="card p-8 text-center">
          <p className="text-surface-400 text-sm">Select a project to mark attendance</p>
        </div>
      )}

      {selectedProject && attLoading && <LoadingSpinner />}

      {selectedProject && !attLoading && workerStates.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-surface-500 text-sm font-medium">No workers assigned to this project</p>
          <p className="text-surface-400 text-xs mt-1">Go to the project page to assign workers first.</p>
        </div>
      )}

      {workerStates.length > 0 && (
        <>
          {/* Workers attendance cards */}
          <div className="space-y-3 mb-5">
            {workerStates.map(w => (
              <div key={w.worker_id} className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-brand-700">{w.worker_name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-surface-900">{w.worker_name}</p>
                    <p className="text-xs text-surface-400">{WORKER_TYPE_LABELS[w.worker_type]} · {formatRupees(w.daily_wage)}/day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-surface-400">Today</p>
                    <p className="text-sm font-bold text-surface-900">
                      {formatRupees(
                        w.status === 'present' ? parseFloat(w.daily_wage) :
                        w.status === 'half_day' ? parseFloat(w.daily_wage) / 2 : 0
                      )}
                    </p>
                  </div>
                </div>

                {/* Attendance buttons */}
                <div className="flex gap-2">
                  <button
                    data-active={w.status === 'present'}
                    onClick={() => setStatus(w.worker_id, 'present')}
                    className="att-btn att-btn-present"
                  >
                    ✓ Present
                  </button>
                  <button
                    data-active={w.status === 'half_day'}
                    onClick={() => setStatus(w.worker_id, 'half_day')}
                    className="att-btn att-btn-half"
                  >
                    ½ Half
                  </button>
                  <button
                    data-active={w.status === 'absent'}
                    onClick={() => setStatus(w.worker_id, 'absent')}
                    className="att-btn att-btn-absent"
                  >
                    ✗ Absent
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + save */}
          <div className="card p-4 sticky bottom-20 lg:bottom-4 shadow-modal">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">
                  {workerStates.filter(w => w.status === 'present').length} Present
                </span>
                <span className="text-orange-600 font-medium">
                  {workerStates.filter(w => w.status === 'half_day').length} Half
                </span>
                <span className="text-red-600 font-medium">
                  {workerStates.filter(w => w.status === 'absent').length} Absent
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-surface-400">Today's Labour</p>
                <p className="text-base font-bold text-surface-900">{formatRupees(totalLabour)}</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`w-full btn-lg ${saved ? 'btn-secondary text-green-600' : 'btn-primary'}`}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saved && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              {saving ? 'Saving...' : saved ? 'Attendance Saved!' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

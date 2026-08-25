import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Camera } from 'lucide-react';
import { siteUpdatesApi, projectsApi } from '../../api/client';
import { LoadingSpinner, PageHeader } from '../../components/ui';
import { formatDate } from '../../utils';

export default function SiteUpdatesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [progress, setProgress] = useState(50);
  const [workCompleted, setWorkCompleted] = useState('');
  const [issues, setIssues] = useState('');
  const [weather, setWeather] = useState('Sunny');
  const [logging, setLogging] = useState(false);

  const { data: updateData, isLoading } = useQuery({
    queryKey: ['site-updates', projectId],
    queryFn: async () => (await siteUpdatesApi.list({ project_id: projectId || undefined })).data.data,
  });

  const { data: projData } = useQuery({
    queryKey: ['projects', {}],
    queryFn: async () => (await projectsApi.list({ per_page: 100 })).data.data,
  });

  const updates = updateData || [];
  const projects = projData || [];

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title) return alert('Please select project and enter update title');
    setLogging(true);
    try {
      await siteUpdatesApi.create({
        project_id: projectId,
        title,
        progress_percentage: progress,
        work_completed: workCompleted,
        issues_blockers: issues,
        weather_condition: weather,
        date: new Date().toISOString().split('T')[0],
      });
      qc.invalidateQueries({ queryKey: ['site-updates'] });
      setShowModal(false);
      setTitle('');
      setWorkCompleted('');
      setIssues('');
      alert('🎉 Daily site work update logged!');
    } catch (err) {
      alert('Failed to log site update');
    } finally {
      setLogging(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Daily Site Work Updates"
        subtitle="Track daily site progress, photo logs, completion % and site blockers"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Log Site Update
          </button>
        }
      />

      {/* Filter */}
      <div className="mb-6 max-w-xs">
        <select className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {isLoading && <LoadingSpinner />}

      {!isLoading && updates.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4 text-neutral-900">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">No Daily Updates Logged Yet</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Log site diary updates, weather conditions, work progress percentages, and site issues.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Log Today's Work Progress
          </button>
        </div>
      )}

      {updates.length > 0 && (
        <div className="space-y-4">
          {updates.map((up: any) => (
            <div key={up.id} className="card p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">{up.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-900 text-white text-xs font-bold">
                      {up.progress_percentage}% Completed
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{formatDate(up.date)} · Weather: {up.weather_condition}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden mb-4">
                <div className="bg-neutral-900 h-full transition-all" style={{ width: `${up.progress_percentage}%` }} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-50 p-3 rounded-xl">
                <div>
                  <span className="font-bold text-neutral-700 uppercase tracking-wider block mb-1">Work Completed Today:</span>
                  <p className="text-neutral-800">{up.work_completed || 'No specific notes recorded.'}</p>
                </div>
                <div>
                  <span className="font-bold text-neutral-700 uppercase tracking-wider block mb-1">Site Issues / Blockers:</span>
                  <p className="text-neutral-800">{up.issues_blockers || 'None reported.'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative text-neutral-900">
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 font-bold">✕</button>

            <h2 className="text-xl font-bold mb-4">Log Daily Site Progress</h2>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              <div>
                <label className="form-label">Select Project *</label>
                <select required className="form-select" value={projectId} onChange={e => setProjectId(e.target.value)}>
                  <option value="">Select Project...</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Update Title / Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Completed 1st Floor Slab Casting"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="form-label mb-0">Project Completion: {progress}%</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={e => setProgress(Number(e.target.value))}
                  className="w-full accent-neutral-900 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Weather Condition</label>
                  <select className="form-select" value={weather} onChange={e => setWeather(e.target.value)}>
                    <option value="Sunny">☀️ Sunny / Clear</option>
                    <option value="Rainy">🌧️ Rainy</option>
                    <option value="Cloudy">☁️ Cloudy</option>
                    <option value="Windy">💨 Windy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Work Completed Summary</label>
                <textarea
                  rows={2}
                  placeholder="Describe tasks finished by workers today..."
                  value={workCompleted}
                  onChange={e => setWorkCompleted(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Issues / Delay Blockers</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Cement delivery delayed by 2 hours"
                  value={issues}
                  onChange={e => setIssues(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={logging} className="w-full btn-primary btn-lg mt-2">
                {logging ? 'Saving...' : 'Publish Daily Site Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

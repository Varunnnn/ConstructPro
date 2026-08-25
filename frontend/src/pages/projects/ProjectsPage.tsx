import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { projectsApi } from '../../api/client';
import { LoadingSpinner, ErrorMessage, EmptyState, PageHeader, Badge } from '../../components/ui';
import { formatRupees, formatDate, PROJECT_STATUS_LABELS } from '../../utils';
import type { Project } from '../../types';

const STATUS_OPTIONS = ['', 'active', 'planning', 'on_hold', 'completed', 'cancelled'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', { search, status }],
    queryFn: async () => {
      const res = await projectsApi.list({ search: search || undefined, status: status || undefined });
      return res.data;
    },
  });

  const projects: Project[] = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle={`${data?.total || 0} total projects`}
        action={
          <button onClick={() => navigate('/projects/new')} className="btn-primary">
            <Plus className="w-4 h-4" /> New Project
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            className="form-input pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select w-auto" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.filter(Boolean).map(s => (
            <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage message="Failed to load projects." />}

      {!isLoading && projects.length === 0 && (
        <EmptyState
          icon={<FolderOpen className="w-8 h-8 text-surface-400" />}
          title="No projects yet"
          description="Create your first construction project to start tracking costs and profitability."
          action={
            <button onClick={() => navigate('/projects/new')} className="btn-primary">
              <Plus className="w-4 h-4" /> Create Project
            </button>
          }
        />
      )}

      {/* Project cards (mobile) / table (desktop) */}
      <div className="space-y-3 lg:hidden">
        {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
      </div>

      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Project</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Customer</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Contract Value</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Start Date</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-surface-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {projects.map(p => (
              <tr
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="hover:bg-surface-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-surface-900">{p.name}</p>
                  {p.site_address && <p className="text-xs text-surface-400 mt-0.5 truncate max-w-xs">{p.site_address}</p>}
                </td>
                <td className="px-5 py-4 text-sm text-surface-600">{p.customer_name || '—'}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold text-surface-900">{formatRupees(p.contract_value)}</td>
                <td className="px-5 py-4 text-sm text-surface-600">{formatDate(p.start_date)}</td>
                <td className="px-5 py-4"><Badge status={p.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {projects.length === 0 && !isLoading && (
          <div className="py-12 text-center text-sm text-surface-400">No projects found</div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div onClick={onClick} className="card-hover p-4 cursor-pointer active:scale-[0.99] transition-transform">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-surface-900 truncate">{project.name}</h3>
          {project.customer_name && <p className="text-xs text-surface-500 mt-0.5">{project.customer_name}</p>}
        </div>
        <Badge status={project.status} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-surface-400">Contract Value</p>
          <p className="text-base font-bold text-surface-900">{formatRupees(project.contract_value)}</p>
        </div>
        {project.start_date && (
          <div className="text-right">
            <p className="text-xs text-surface-400">Started</p>
            <p className="text-xs text-surface-600">{formatDate(project.start_date)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

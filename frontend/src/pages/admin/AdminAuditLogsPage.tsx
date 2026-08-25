import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/client';
import { FileText, AlertTriangle } from 'lucide-react';
import { formatDate } from '../../utils';

const ACTION_COLORS: Record<string, string> = {
  ASSIGN_PLAN: 'text-neutral-900 bg-neutral-100 border-neutral-300',
  EXTEND_TRIAL: 'text-amber-800 bg-amber-50 border-amber-200',
  SUSPEND: 'text-red-700 bg-red-50 border-red-200',
  REACTIVATE: 'text-emerald-700 bg-emerald-50 border-emerald-200',
};

export default function AdminAuditLogsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await adminApi.getAuditLogs()).data.data,
    refetchInterval: 30_000,
  });

  const logs = data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Audit Logs</h1>
        <p className="text-neutral-500 text-sm mt-1">
          A traceable record of all admin actions on the platform.
        </p>
      </div>

      <div className="bg-white/80 border border-neutral-200 rounded-2xl overflow-hidden shadow-sm backdrop-blur-md">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-600 p-6 bg-red-50">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-semibold">Failed to load audit logs.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm font-medium">No admin actions recorded yet.</p>
            <p className="text-xs text-neutral-500 mt-1">Actions like plan assignments and trial extensions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 uppercase tracking-wider bg-neutral-50/50">
                  <th className="px-5 py-4 font-bold">Timestamp</th>
                  <th className="px-5 py-4 font-bold">Action</th>
                  <th className="px-5 py-4 font-bold">Target</th>
                  <th className="px-5 py-4 font-bold">Before</th>
                  <th className="px-5 py-4 font-bold">After / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-4 text-xs text-neutral-500 font-medium whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase border ${ACTION_COLORS[log.action] || 'text-neutral-700 bg-neutral-100 border-neutral-200'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-neutral-900 font-semibold capitalize">{log.target_type}</p>
                      <p className="text-xs text-neutral-500 font-mono truncate max-w-[140px]" title={log.target_id}>
                        {log.target_id?.slice(0, 16)}...
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-600">
                      {log.old_value || <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-5 py-4 text-sm text-neutral-800 font-medium max-w-xs truncate" title={log.new_value}>
                      {log.new_value || <span className="text-neutral-400">—</span>}
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

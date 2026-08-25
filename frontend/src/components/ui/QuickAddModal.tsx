import { useNavigate } from 'react-router-dom';
import { ClipboardList, Receipt, Package, Users, X } from 'lucide-react';

const QUICK_ACTIONS = [
  { icon: ClipboardList, label: 'Add Attendance', to: '/attendance', color: 'bg-green-50 text-green-700 border-green-200' },
  { icon: Receipt, label: 'Add Expense', to: '/expenses/new', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { icon: Package, label: 'Add Material', to: '/materials/new', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { icon: Users, label: 'Add Worker', to: '/workers/new', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const handleAction = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl lg:rounded-2xl w-full max-w-sm mx-4 lg:mx-auto p-5 shadow-modal">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-surface-900">Quick Add</h3>
          <button onClick={onClose} className="btn-icon btn-secondary btn-sm">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map(({ icon: Icon, label, to, color }) => (
            <button
              key={to}
              onClick={() => handleAction(to)}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border ${color} transition-all active:scale-95`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-semibold text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 min-h-[250px]">
      <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      
      {action && (
        <button onClick={action.onClick} className="co-btn co-btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

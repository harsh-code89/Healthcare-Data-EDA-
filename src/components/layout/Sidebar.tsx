import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { NavLink } from 'react-router-dom';
import { 
  Heart, Home, FileText, Calendar, Pill, MessageSquare, 
  Users, Shield, Activity, FileBarChart2, X 
} from 'lucide-react';
import clsx from 'clsx';

const PATIENT_NAV = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/health-record', label: 'Health Record', icon: FileText },
  { path: '/timeline', label: 'Care Timeline', icon: Activity },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/reports', label: 'Reports', icon: FileBarChart2 },
  { path: '/medications', label: 'Medications', icon: Pill },
  { path: '/ai-assistant', label: 'AI Assistant', icon: MessageSquare },
  { path: '/care-team', label: 'Care Team', icon: Users },
  { path: '/family', label: 'Family', icon: Users },
  { path: '/emergency', label: 'Emergency Profile', icon: Shield },
  { path: '/privacy', label: 'Privacy & Consent', icon: Shield },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { sidebarOpen } = useApp();
  const { user } = useAuth();

  return (
    <aside className={clsx("co-sidebar", sidebarOpen ? "co-sidebar-open" : "")}>
      <div className="co-sidebar-logo">
        <NavLink to="/" className="co-brand" onClick={onClose}>
          <div className="co-brand-icon">
            <Heart className="h-5 w-5" />
          </div>
          <span>CareOS</span>
        </NavLink>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-md">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="co-sidebar-nav">
        <div className="co-sidebar-section-label">Menu</div>
        {PATIENT_NAV.map((item) => {
          const Icon = item.icon;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => clsx("co-sidebar-item", isActive && "active")}
            >
              <Icon className="co-sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
          <div className="w-8 h-8 rounded bg-cyan-600 text-white flex items-center justify-center font-bold text-xs uppercase">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-700 capitalize truncate">{user?.name || 'User'}</span>
            <span className="text-[10px] text-slate-500">Patient Profile</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

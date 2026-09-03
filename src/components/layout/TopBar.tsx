import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Menu, Search, Bell, User, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { UserProfileModal } from '../Auth/UserProfileModal';

export function TopBar() {
  const { setSidebarOpen, sidebarOpen } = useApp();
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format the current page ID into a readable title
  let path = location.pathname.replace('/', '');
  if (!path) path = 'dashboard';
  
  const pageTitle = path
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <header className="co-topbar">
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors md:hidden"
        aria-label="Toggle Menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="font-semibold text-lg text-slate-900 hidden sm:block">
        {pageTitle}
      </div>

      <div className="flex-1" />

      <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
        <Search className="h-5 w-5" />
      </button>

      <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
        <Bell className="h-5 w-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>

      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 p-1 pl-2 pr-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full transition-colors ml-2"
        >
          <div className="w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">
            {user?.name?.split(' ')[0] || 'User'}
          </span>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">{user?.name || 'Demo User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || 'demo@careos.in'}</p>
            </div>
            
            <div className="py-1">
              <button 
                onClick={() => { setShowProfileModal(true); setShowUserMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <User className="h-4 w-4" /> Profile Settings
              </button>
            </div>
            
            <div className="border-t border-slate-100 py-1">
              <button 
                onClick={() => logout()}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {showProfileModal && (
        <UserProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </header>
  );
}

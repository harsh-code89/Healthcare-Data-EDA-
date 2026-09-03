import { useEffect, useRef } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardShell() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top on page change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Handle scroll animations
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-visible", e.isIntersecting)),
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [location.pathname]);

  return (
    <div className="co-dashboard-shell">
      <Sidebar onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <TopBar />
      
      <main ref={contentRef} className="co-main-content">
        <div className="co-page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

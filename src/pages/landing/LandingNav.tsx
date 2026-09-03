import { useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';

interface LandingNavProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  navSolid: boolean;
}

export function LandingNav({ onGetStarted, onSignIn, navSolid }: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navClass = `co-landing-nav ${navSolid ? 'solid' : ''}`;

  return (
    <nav className={navClass}>
      <div className="co-landing-nav-inner">
        <div className="co-brand" onClick={() => window.scrollTo(0,0)}>
          <div className="co-brand-icon shadow-sm">
            <Heart className="h-5 w-5" />
          </div>
          <span className="text-xl tracking-tight">CareOS</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Platform</a>
          <a href="#for-providers" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">For Providers</a>
          <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">FAQ</a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <button onClick={onSignIn} className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors px-3 py-2">
            Sign in
          </button>
          <button onClick={onGetStarted} className="co-btn co-btn-primary shadow-sm">
            Get Started
          </button>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-600"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 p-4 flex flex-col gap-4 shadow-xl md:hidden">
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2">How it works</a>
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2">Platform</a>
          <a href="#for-providers" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2">For Providers</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium text-slate-700 p-2">FAQ</a>
          <div className="h-px bg-slate-100 my-2" />
          <button onClick={() => { setMobileMenuOpen(false); onSignIn(); }} className="co-btn co-btn-secondary w-full justify-center">
            Sign in
          </button>
          <button onClick={() => { setMobileMenuOpen(false); onGetStarted(); }} className="co-btn co-btn-primary w-full justify-center">
            Get Started
          </button>
        </div>
      )}
    </nav>
  );
}

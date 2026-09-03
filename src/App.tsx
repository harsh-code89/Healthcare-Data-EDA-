import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Layout & Shared
import { DashboardShell } from './components/layout/DashboardShell';
import { LandingPage } from './pages/landing/LandingPage';
import { AuthPage, type AuthMode } from './components/AuthPage';

// Patient Pages
import { Dashboard as PatientDashboard } from './pages/patient/Dashboard';
import { HealthRecord } from './pages/patient/HealthRecord';
import { Timeline } from './pages/patient/Timeline';
import { Appointments } from './pages/patient/Appointments';
import { Reports } from './pages/patient/Reports';
import { Medications } from './pages/patient/Medications';
import { AIAssistant } from './pages/patient/AIAssistant';
import { CareTeam } from './pages/patient/CareTeam';
import { Family } from './pages/patient/Family';
import { EmergencyProfile } from './pages/patient/EmergencyProfile';
import { Privacy } from './pages/patient/Privacy';

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();
  
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Loading CareOS...</p>
        </div>
      </div>
    );
  }

  // Show Auth Page if explicitly requested and not authenticated
  if (showAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col relative">
        <button 
          onClick={() => setShowAuth(false)}
          className="absolute top-4 left-4 p-2 text-slate-500 hover:bg-slate-200 rounded-md transition-colors z-10 font-medium text-sm"
        >
          ← Back to site
        </button>
        <AuthPage 
          mode={authMode} 
          onModeChange={(mode) => setAuthMode(mode || 'sign-in')} 
        />
      </div>
    );
  }

  // Unauthenticated -> Landing Page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={
          <LandingPage 
            onGetStarted={() => { setShowAuth(true); setAuthMode('sign-up'); }} 
            onSignIn={() => { setShowAuth(true); setAuthMode('sign-in'); }} 
          />
        } />
      </Routes>
    );
  }

  // Authenticated -> Dashboard Routes
  return (
    <Routes>
      <Route element={<DashboardShell />}>
        <Route path="/" element={<PatientDashboard />} />
        <Route path="/health-record" element={<HealthRecord />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/medications" element={<Medications />} />
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/care-team" element={<CareTeam />} />
        <Route path="/family" element={<Family />} />
        <Route path="/emergency" element={<EmergencyProfile />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <AppRouter />
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

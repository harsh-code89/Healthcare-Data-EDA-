import { Shield, Lock, FileText, Globe2, Sparkles, Activity, Pill, Calendar } from 'lucide-react';

export function HeroSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="pt-32 pb-16 px-6 md:pt-40 md:pb-24 relative overflow-hidden flex flex-col items-center">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 pointer-events-none" 
           style={{ background: 'radial-gradient(ellipse at top, #0891b2 0%, transparent 70%)' }} />
           
      <div className="max-w-4xl mx-auto text-center relative z-10" data-reveal>
        <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 text-cyan-700 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm">
          <Sparkles className="h-4 w-4" />
          <span>Your Health, Your Control</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
          Your healthcare journey, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">
            finally connected.
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
          Securely organize your health records, appointments, reports, medications, and care journey — while keeping full control over how your information is shared.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button onClick={onGetStarted} className="co-btn co-btn-primary co-btn-lg w-full sm:w-auto shadow-md">
            Get Started — it's free
          </button>
          <a href="#how-it-works" className="co-btn co-btn-secondary co-btn-lg w-full sm:w-auto bg-white">
            See how it works
          </a>
        </div>
        
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-500 mb-20">
          <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-slate-400" /> Privacy-first design</div>
          <div className="flex items-center gap-2"><Lock className="h-4 w-4 text-slate-400" /> Consent-driven sharing</div>
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /> Patient-controlled records</div>
          <div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-slate-400" /> Built for Indian healthcare</div>
        </div>
      </div>

      {/* Dashboard Preview Mockup */}
      <div className="w-full max-w-5xl mx-auto relative z-10" data-reveal>
        <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-2xl overflow-hidden transform perspective-1000 rotate-x-2">
          {/* Mock Header */}
          <div className="h-14 border-b border-slate-200 bg-slate-50/80 flex items-center px-4 gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white h-8 rounded-md border border-slate-200 max-w-md mx-auto flex items-center px-3 text-xs text-slate-400">
              <Lock className="h-3 w-3 mr-2" /> careos.in/dashboard
            </div>
          </div>
          {/* Mock Content */}
          <div className="p-6 md:p-10 bg-slate-50">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Good morning, Priya ☀️</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Calendar className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Next Appointment</div>
                  <div className="font-bold text-slate-900 mt-1">Tomorrow, 10:30 AM</div>
                  <div className="text-sm text-slate-600">Dr. Venkat Rao</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Pill className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Active Medications</div>
                  <div className="font-bold text-slate-900 mt-1">3 Prescriptions</div>
                  <div className="text-sm text-slate-600">Next due: 08:00 AM</div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Activity className="h-5 w-5" /></div>
                <div>
                  <div className="text-sm text-slate-500 font-medium">Recent Report</div>
                  <div className="font-bold text-slate-900 mt-1">Complete Blood Count</div>
                  <div className="text-sm text-slate-600">Uploaded 2 days ago</div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}

import { CheckCircle2 } from 'lucide-react';

export function ForPatientsSection() {
  const benefits = [
    'Complete health history in one secure place',
    'Never repeat your medical history to a new doctor again',
    'Understand your medical reports in plain language',
    'Track your medications and get timely reminders',
    'Emergency profile accessible in seconds',
    'Built for Indian healthcare realities'
  ];

  return (
    <section className="co-section bg-cyan-900 text-white overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-800 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-900 rounded-full blur-3xl opacity-50" />
      
      <div className="co-section-inner relative z-10" data-reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div>
            <div className="text-cyan-400 font-bold tracking-wider text-sm mb-4">FOR PATIENTS</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white leading-tight">
              Designed around you, <br className="hidden sm:block" />not the hospital.
            </h2>
            <p className="text-cyan-100 text-lg mb-8 leading-relaxed">
              Your health data shouldn't be locked inside hospital systems. CareOS gives you a unified, beautifully organized view of your entire healthcare journey.
            </p>
            
            <ul className="flex flex-col gap-4">
              {benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-cyan-400 shrink-0" />
                  <span className="text-cyan-50">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6 backdrop-blur-sm shadow-2xl flex flex-col">
              {/* Mock App UI */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-xl font-bold">P</div>
                <div>
                  <div className="font-bold text-lg text-white">Priya Sharma</div>
                  <div className="text-sm text-cyan-300">Blood Group: O+</div>
                </div>
              </div>
              
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 mb-4">
                <div className="text-xs text-slate-400 mb-1">Critical Allergy</div>
                <div className="text-red-400 font-medium">Penicillin (Severe)</div>
              </div>
              
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 flex-1">
                <div className="text-xs text-slate-400 mb-3">Recent Timeline</div>
                <div className="flex gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <div className="text-sm text-white font-medium">Complete Blood Count</div>
                    <div className="text-xs text-slate-400">12 Aug 2026</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <div className="text-sm text-white font-medium">Consultation - Dr. Rao</div>
                    <div className="text-xs text-slate-400">05 Sep 2026 (Upcoming)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}

import { ClipboardList, FileText, RefreshCw, Link2Off, HelpCircle, AlertTriangle } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      icon: ClipboardList,
      title: 'Different doctors, different systems',
      desc: 'Each hospital has its own records. Nothing follows you.'
    },
    {
      icon: FileText,
      title: 'Reports on WhatsApp, prescriptions on paper',
      desc: 'Your health data lives in scattered photos, PDFs, and paper bags.'
    },
    {
      icon: RefreshCw,
      title: 'Repeating your history at every visit',
      desc: 'New doctor? Start from scratch. Again.'
    },
    {
      icon: Link2Off,
      title: 'Follow-ups missed, continuity broken',
      desc: 'Between consultations, important things slip through the gaps.'
    },
    {
      icon: HelpCircle,
      title: 'Medical terms no one explains',
      desc: 'Lab reports full of values you don\'t understand.'
    },
    {
      icon: AlertTriangle,
      title: 'Emergencies without context',
      desc: 'Critical information unavailable when it matters most.'
    }
  ];

  return (
    <section className="co-section bg-slate-50 border-y border-slate-200">
      <div className="co-section-inner" data-reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="co-section-label text-rose-600">THE PROBLEM</div>
          <h2 className="co-section-title">Your health information is scattered everywhere.</h2>
          <p className="co-section-desc mx-auto">
            Healthcare is fragmented. You visit multiple specialists, undergo tests at different labs, and try to manage it all with paper files and disconnected apps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {problems.map((prob, i) => {
            const Icon = prob.icon;
            return (
              <div key={i} className="bg-white border border-rose-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow" data-reveal>
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-5">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{prob.title}</h3>
                <p className="text-slate-600">{prob.desc}</p>
              </div>
            );
          })}
        </div>
        
        <div className="flex items-center justify-center gap-4 text-cyan-600 font-semibold tracking-wide" data-reveal>
          <div className="h-px bg-cyan-200 w-16" />
          <span>CareOS brings it all together</span>
          <div className="h-px bg-cyan-200 w-16" />
        </div>
      </div>
    </section>
  );
}

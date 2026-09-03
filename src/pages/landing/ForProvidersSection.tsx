import { Users, Pill, FileBarChart, Stethoscope } from 'lucide-react';

export function ForProvidersSection() {
  const benefits = [
    {
      icon: Users,
      title: 'Patient arrives with full history',
      desc: 'No more time wasted trying to piece together a patient\'s past records from memory or crumpled papers.'
    },
    {
      icon: Pill,
      title: 'Organized medication list',
      desc: 'Review current and past medications at a glance, reducing adverse drug interactions.'
    },
    {
      icon: FileBarChart,
      title: 'Previous investigations available',
      desc: 'Direct access to prior lab reports and imaging, avoiding duplicate testing.'
    },
    {
      icon: Stethoscope,
      title: 'Clear consultation workflow',
      desc: 'Manage clinical notes, write prescriptions, and schedule follow-ups in one intuitive flow.'
    }
  ];

  return (
    <section id="for-providers" className="co-section bg-slate-900 text-white">
      <div className="co-section-inner" data-reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-slate-400 font-bold tracking-wider text-sm mb-4">FOR HEALTHCARE PROFESSIONALS</div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-white leading-tight">Better consultations start with better context.</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            When patients arrive with their securely organized health timeline, your consultations become more efficient, accurate, and effective.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {benefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex items-start gap-4" data-reveal>
                <div className="w-12 h-12 bg-slate-700 text-cyan-400 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{benefit.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-center" data-reveal>
          <div className="inline-block bg-slate-800 border border-slate-700 text-slate-400 text-sm px-6 py-4 rounded-xl max-w-2xl">
            <span className="font-semibold text-white block mb-1">Note for Providers:</span>
            Provider accounts undergo verification. CareOS is currently a standalone patient platform and does not automatically integrate with your hospital's existing EMR system without explicit setup.
          </div>
        </div>
      </div>
    </section>
  );
}

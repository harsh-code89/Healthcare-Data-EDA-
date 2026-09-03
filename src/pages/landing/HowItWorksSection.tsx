export function HowItWorksSection() {
  const steps = [
    {
      num: 1,
      title: 'Create your profile',
      desc: 'Set up your health profile with your blood group, allergies, and emergency contacts.'
    },
    {
      num: 2,
      title: 'Build your timeline',
      desc: 'Upload past reports, log previous consultations, and build your unified health timeline.'
    },
    {
      num: 3,
      title: 'Manage your health',
      desc: 'Book appointments, track active medications, and use the AI assistant to understand reports.'
    },
    {
      num: 4,
      title: 'Share with consent',
      desc: 'Securely share your records with doctors. You control who gets access and for how long.'
    }
  ];

  return (
    <section id="how-it-works" className="co-section bg-slate-50 border-t border-slate-200">
      <div className="co-section-inner" data-reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="co-section-label">HOW IT WORKS</div>
          <h2 className="co-section-title">Four steps to connected care.</h2>
        </div>

        <div className="co-steps relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[2px] bg-cyan-100 z-0" />
          
          {steps.map((step, i) => (
            <div key={i} className="co-step relative z-10" data-reveal>
              <div className="co-step-number shadow-md shadow-cyan-500/20">{step.num}</div>
              <h3 className="co-step-title">{step.title}</h3>
              <p className="co-step-desc px-4">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

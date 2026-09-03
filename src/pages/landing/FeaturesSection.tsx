import { FileText, Calendar, Pill, MessageSquare, Shield, Lock } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: 'Unified Health Record',
      desc: 'All your consultations, reports, prescriptions, and diagnoses in one secure, organized timeline.'
    },
    {
      icon: Calendar,
      title: 'Smart Appointments',
      desc: 'Book, track, and never miss an appointment. Teleconsultation built in.'
    },
    {
      icon: Pill,
      title: 'Medication Manager',
      desc: 'Track medications, dosages, reminders, and your complete prescription history.'
    },
    {
      icon: MessageSquare,
      title: 'AI Health Assistant',
      desc: 'Understand your reports in plain language. An assistant to help you prepare, not a doctor.'
    },
    {
      icon: Shield,
      title: 'Emergency Profile',
      desc: 'Instantly shareable emergency card with blood group, allergies, and critical info.'
    },
    {
      icon: Lock,
      title: 'Privacy & Consent',
      desc: 'You decide who sees what. Share records with providers, and revoke access anytime.'
    }
  ];

  return (
    <section id="features" className="co-section bg-white">
      <div className="co-section-inner" data-reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="co-section-label">PLATFORM CAPABILITIES</div>
          <h2 className="co-section-title">Everything for your healthcare journey.</h2>
          <p className="co-section-desc mx-auto">
            A comprehensive suite of tools designed to put you back in control of your health data and care coordination.
          </p>
        </div>

        <div className="co-feature-grid">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div key={i} className="co-feature-card" data-reveal>
                <div className="co-feature-icon">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="co-feature-title">{feat.title}</h3>
                <p className="co-feature-desc">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { Fingerprint, CheckSquare, Network, FileText, Info } from 'lucide-react';

export function ABDMSection() {
  const cards = [
    {
      icon: Fingerprint,
      title: 'ABHA ID Support',
      desc: 'Your Ayushman Bharat Health Account ID field is supported in your profile for future integration.'
    },
    {
      icon: CheckSquare,
      title: 'Consent-first Design',
      desc: 'All data sharing follows explicit patient consent, fully aligned with ABDM privacy principles.'
    },
    {
      icon: Network,
      title: 'Interoperability Planned',
      desc: 'System architecture designed for future integration with national Health Information Exchanges.'
    },
    {
      icon: FileText,
      title: 'PHR Aligned',
      desc: 'Personal Health Record data models designed following National Health Authority guidelines.'
    }
  ];

  return (
    <section className="co-section bg-gradient-to-br from-cyan-50 to-blue-50">
      <div className="co-section-inner" data-reveal>
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="co-section-label text-cyan-700">ABDM-COMPATIBLE ARCHITECTURE</div>
          <h2 className="co-section-title">Designed for India's Digital Health Ecosystem</h2>
          <p className="co-section-desc mx-auto">
            CareOS is designed with India's Ayushman Bharat Digital Mission (ABDM) principles at its core — prioritizing patient-centric records, consent-based sharing, and interoperability.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex gap-4" data-reveal>
                <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4 max-w-3xl mx-auto" data-reveal>
          <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Important notice:</strong> CareOS is not currently integrated with ABDM or NHA live systems. ABHA ID storage is supported for future use. This section describes our architectural alignment and design philosophy, not active government integration.
          </div>
        </div>
      </div>
    </section>
  );
}

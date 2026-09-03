import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is my health information safe and private?',
      a: 'Yes. CareOS is built on a privacy-first architecture. Your data is encrypted, and we employ strict access controls. Most importantly, no one — not even your doctor — can view your health records without your explicit consent.'
    },
    {
      q: 'Is CareOS connected to my hospital or doctor?',
      a: 'CareOS is a patient-initiated platform. Currently, it does not automatically pull data from your hospital\'s EMR system. You upload your reports and log your consultations, creating a unified record you can share with any doctor at any hospital.'
    },
    {
      q: 'What is the AI assistant? Can it diagnose me?',
      a: 'No. The CareOS AI Assistant is strictly an informational tool. It can help explain complex medical terms in your lab reports in plain language and help you prepare questions for your doctor. It cannot provide medical advice, diagnosis, or treatment plans.'
    },
    {
      q: 'What is ABHA and does CareOS support it?',
      a: 'ABHA (Ayushman Bharat Health Account) is India\'s digital health ID. While our architecture is aligned with ABDM principles, CareOS is currently an independent platform and does not actively sync with the live government ABDM network. You can store your ABHA ID in your profile for future use.'
    },
    {
      q: 'Can I share records with my doctor?',
      a: 'Yes. You can grant temporary or permanent access to specific verified healthcare providers on the platform. You control exactly what they can see, and you can revoke access at any time from your Privacy & Consent center.'
    },
    {
      q: 'Is this free to use?',
      a: 'This version of CareOS is a demonstration platform and is completely free to use for personal health tracking and organization.'
    },
    {
      q: 'Can I manage health records for my family?',
      a: 'Yes. The platform includes a Family module where you can add dependents (like children or elderly parents) and manage their health timelines under your account.'
    },
    {
      q: 'How do I delete my data?',
      a: 'You have full control over your data. In the Privacy Center, you can download an export of all your health records or request a complete, permanent deletion of your account and all associated data.'
    }
  ];

  return (
    <section id="faq" className="co-section bg-white border-t border-slate-200">
      <div className="co-section-inner max-w-3xl" data-reveal>
        <div className="text-center mb-12">
          <h2 className="co-section-title">Frequently Asked Questions</h2>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <div key={i} className="co-faq-item">
              <button 
                className="co-faq-question"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span>{faq.q}</span>
                <ChevronDown className={clsx("h-5 w-5 text-slate-400 transition-transform", openIndex === i && "rotate-180")} />
              </button>
              
              <div 
                className="grid transition-all duration-200 ease-in-out"
                style={{ gridTemplateRows: openIndex === i ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="co-faq-answer pt-2">
                    {faq.a}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

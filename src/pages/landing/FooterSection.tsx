import { Heart } from 'lucide-react';

export function FooterSection() {
  const scrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="co-footer">
      <div className="co-footer-inner">
        <div className="co-footer-grid">
          
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 font-bold text-xl text-white mb-4 cursor-pointer" onClick={scrollToTop}>
              <div className="w-8 h-8 rounded bg-cyan-600 flex items-center justify-center text-white">
                <Heart className="h-4 w-4" />
              </div>
              CareOS
            </div>
            <p className="co-footer-tagline mb-6">
              Your healthcare journey, finally connected. Organize your health records, appointments, and medications securely.
            </p>
          </div>
          
          <div>
            <div className="co-footer-col-title">Platform</div>
            <div className="flex flex-col gap-2">
              <a href="#" onClick={scrollToTop} className="co-footer-link">Dashboard</a>
              <a href="#" onClick={scrollToTop} className="co-footer-link">Health Record</a>
              <a href="#" onClick={scrollToTop} className="co-footer-link">Appointments</a>
              <a href="#" onClick={scrollToTop} className="co-footer-link">AI Assistant</a>
            </div>
          </div>
          
          <div>
            <div className="co-footer-col-title">Company</div>
            <div className="flex flex-col gap-2">
              <a href="#" onClick={(e) => e.preventDefault()} className="co-footer-link">About Us</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="co-footer-link">Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="co-footer-link">Terms of Service</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="co-footer-link">Security</a>
            </div>
          </div>
          
        </div>
        
        <div className="border-t border-slate-700/50 pt-8 pb-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 mb-6">
            <div>&copy; 2026 CareOS. Built for India's healthcare.</div>
            <div className="flex gap-4">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Privacy Policy</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Terms of Service</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-slate-300">Security</a>
            </div>
          </div>
          
          <div className="text-[10px] text-slate-600 leading-relaxed text-center max-w-4xl mx-auto">
            <strong>DISCLAIMER:</strong> CareOS is a healthcare information management demonstration platform. It does not provide medical advice, diagnosis, or treatment. The AI Assistant is an informational tool only. Always consult a qualified healthcare professional for medical concerns. CareOS is not affiliated with or approved by the National Health Authority (NHA) or Ayushman Bharat Digital Mission (ABDM). Any mention of ABHA is for architectural demonstration purposes only.
          </div>
        </div>
      </div>
    </footer>
  );
}

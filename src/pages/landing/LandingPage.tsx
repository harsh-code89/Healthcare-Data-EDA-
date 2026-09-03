import { useState, useEffect } from 'react';
import { LandingNav } from './LandingNav';
import { HeroSection } from './HeroSection';
import { ProblemSection } from './ProblemSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { ForPatientsSection } from './ForPatientsSection';
import { ForProvidersSection } from './ForProvidersSection';
import { ABDMSection } from './ABDMSection';
import { FAQSection } from './FAQSection';
import { FooterSection } from './FooterSection';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [navSolid, setNavSolid] = useState(false);

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Scroll progress
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
        
        // Nav background solid state
        setNavSolid(window.scrollY > 20);
      });
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Initialize scroll reveals
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-visible", e.isIntersecting)),
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="co-landing min-h-screen">
      {/* Scroll progress bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-transparent pointer-events-none">
        <div 
          className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-150 ease-out"
          style={{ width: `${Math.min(scrollProgress * 100, 100)}%` }}
        />
      </div>

      <LandingNav onGetStarted={onGetStarted} onSignIn={onSignIn} navSolid={navSolid} />
      
      <main>
        <HeroSection onGetStarted={onGetStarted} />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ForPatientsSection />
        <ForProvidersSection />
        <ABDMSection />
        <FAQSection />
      </main>

      <FooterSection />
    </div>
  );
}

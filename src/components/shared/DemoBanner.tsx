import { X, TestTube2 } from 'lucide-react';
import { useState } from 'react';

export function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="co-demo-banner">
      <TestTube2 className="h-4 w-4 shrink-0 text-amber-600" />
      <div className="flex-1">
        <strong>Demo Mode:</strong> You are viewing mock data. All information is fictional and for demonstration purposes only.
      </div>
      <button 
        onClick={() => setIsVisible(false)} 
        className="p-1 hover:bg-amber-200/50 rounded-full transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4 text-amber-700" />
      </button>
    </div>
  );
}

import { AlertTriangle } from 'lucide-react';

interface AIDisclaimerProps {
  compact?: boolean;
}

export function AIDisclaimer({ compact = false }: AIDisclaimerProps) {
  return (
    <div className="co-ai-disclaimer">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <div>
        <strong className="block mb-1">Important: AI is not a doctor.</strong>
        {!compact && (
          <p>
            CareOS AI is an informational assistant only. It cannot diagnose conditions, prescribe medications, or replace professional medical advice. Always consult a qualified healthcare professional for medical decisions.
          </p>
        )}
      </div>
    </div>
  );
}

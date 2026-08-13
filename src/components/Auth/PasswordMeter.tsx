import { Check, X } from "lucide-react";

interface PasswordMeterProps {
  password: string;
}

export function PasswordMeter({ password }: PasswordMeterProps) {
  const criteria = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const strength = criteria.filter((c) => c.met).length;
  const strengthColor =
    strength === 0 ? "var(--border)" :
    strength === 1 ? "var(--rose)" :
    strength === 2 ? "var(--amber)" :
    strength === 3 ? "var(--cyan)" :
    "var(--emerald)";

  return (
    <div className="password-meter-wrap" style={{ marginTop: "12px", fontSize: "13px", color: "var(--fg-muted)" }}>
      <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            style={{
              height: "4px",
              flex: 1,
              borderRadius: "2px",
              background: idx < strength ? strengthColor : "var(--border)",
              transition: "background 0.3s ease",
            }}
          />
        ))}
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
        {criteria.map((c, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: "6px", color: c.met ? "var(--fg)" : "var(--fg-muted)" }}>
            {c.met ? <Check className="h-3 w-3" style={{ color: "var(--emerald)" }} /> : <X className="h-3 w-3" style={{ opacity: 0.5 }} />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

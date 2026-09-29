import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { authService } from "../../services/authService";
import { useToast } from "../../components/Auth/Toast";
import { PasswordMeter } from "../../components/Auth/PasswordMeter";
import {
  KeyRound,
  LockKeyhole,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

type PageState = "loading" | "ready" | "success" | "invalid" | "expired";

/**
 * ResetPasswordPage
 *
 * Supabase redirects users here after they click the reset link in their email.
 * The URL contains a hash fragment with the access token and type=recovery.
 * Supabase's detectSessionInUrl=true (set in supabaseClient.ts) automatically
 * exchanges this for a valid session and fires onAuthStateChange(PASSWORD_RECOVERY).
 *
 * This page then allows the user to set a new password.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Listen for Supabase's PASSWORD_RECOVERY event.
    // When the user arrives from the reset email link, Supabase detects
    // the token in the URL hash and fires this event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          // Valid recovery session — user can now set a new password
          setPageState("ready");
        } else if (event === "SIGNED_IN" && session) {
          // Already authenticated — check if this was a recovery flow
          // The URL hash might already be consumed, but we can check current state
          if (pageState === "loading") {
            setPageState("ready");
          }
        }
      }
    );

    // Also check if there's already a session (e.g. if the user refreshed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Check the URL for recovery type indicator
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.replace("#", "?"));
        const type = params.get("type");

        if (type === "recovery" || pageState === "loading") {
          setPageState("ready");
        }
      } else {
        // No session and no recovery event — the token might be invalid or expired
        // Give it a moment for the hash-based auth to complete
        setTimeout(() => {
          setPageState((prev) => {
            if (prev === "loading") return "invalid";
            return prev;
          });
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else if (password.length > 128) {
      newErrors.password = "Password must be fewer than 128 characters.";
    } else if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
      newErrors.password =
        "Use a mix of letters and numbers for a stronger password.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authService.updatePassword(password);
      setPageState("success");
      showToast("Password updated successfully!", "success");

      // Redirect to dashboard after a short delay
      setTimeout(() => navigate("/", { replace: true }), 2500);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update password. Please try again.";
      showToast(message, "error");

      // If the session expired during the reset process
      if (
        message.toLowerCase().includes("expired") ||
        message.toLowerCase().includes("invalid") ||
        message.toLowerCase().includes("session")
      ) {
        setPageState("expired");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading state ─────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="auth-screen">
        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-orb auth-art-orb-one" />
          <div className="auth-art-orb auth-art-orb-two" />
          <div className="auth-art-grid" />
        </div>
        <div className="auth-panel">
          <div className="auth-brand">
            <span className="security-brand-mark" />
            <span>CareOS</span>
          </div>
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Loader2
              className="h-10 w-10 animate-spin"
              style={{ color: "var(--cyan)", margin: "0 auto 16px" }}
            />
            <p style={{ color: "var(--fg-muted)", fontSize: "14px" }}>
              Validating your reset link…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Success state ─────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="auth-screen">
        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-orb auth-art-orb-one" />
          <div className="auth-art-orb auth-art-orb-two" />
          <div className="auth-art-grid" />
        </div>
        <div className="auth-panel">
          <div className="auth-brand">
            <span className="security-brand-mark" />
            <span>CareOS</span>
          </div>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "var(--success-bg, #ecfdf5)",
                border: "2px solid var(--success, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <CheckCircle2
                className="h-9 w-9"
                style={{ color: "var(--success, #10b981)" }}
              />
            </div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                margin: "0 0 12px",
                color: "var(--fg)",
              }}
            >
              Password updated!
            </h1>
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: "14px",
                lineHeight: 1.7,
                margin: "0 0 24px",
              }}
            >
              Your password has been changed successfully. You're now signed in
              and will be redirected to your dashboard in a moment.
            </p>
            <div className="auth-trust">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secured by Supabase Auth · End-to-end encrypted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Invalid / Expired token state ─────────────────────────────
  if (pageState === "invalid" || pageState === "expired") {
    return (
      <div className="auth-screen">
        <div className="auth-art" aria-hidden="true">
          <div className="auth-art-orb auth-art-orb-one" />
          <div className="auth-art-orb auth-art-orb-two" />
          <div className="auth-art-grid" />
        </div>
        <div className="auth-panel">
          <div className="auth-brand">
            <span className="security-brand-mark" />
            <span>CareOS</span>
          </div>
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#fef2f2",
                border: "2px solid #fecaca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertTriangle
                className="h-9 w-9"
                style={{ color: "#dc2626" }}
              />
            </div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 700,
                margin: "0 0 12px",
                color: "var(--fg)",
              }}
            >
              {pageState === "expired"
                ? "Link expired"
                : "Invalid reset link"}
            </h1>
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: "14px",
                lineHeight: 1.7,
                margin: "0 0 24px",
              }}
            >
              {pageState === "expired"
                ? "This password reset link has expired. Reset links are valid for 1 hour. Please request a new one."
                : "This reset link is invalid or has already been used. Each reset link can only be used once."}
            </p>
            <button
              className="btn btn-solid auth-submit"
              onClick={() => navigate("/")}
              style={{ width: "100%", justifyContent: "center" }}
            >
              Request a new reset link
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/")}
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready state — show the password reset form ────────────────
  return (
    <div className="auth-screen">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-art-orb auth-art-orb-one" />
        <div className="auth-art-orb auth-art-orb-two" />
        <div className="auth-art-grid" />
        <div className="auth-art-card auth-art-card-one">
          <span>End-to-end</span>
          <strong>Encrypted</strong>
          <i />
        </div>
        <div className="auth-art-card auth-art-card-two">
          <span>
            <span className="auth-art-live" /> Data
          </span>
          <strong>Protected</strong>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-brand">
          <span className="security-brand-mark" />
          <span>CareOS</span>
        </div>

        <div className="auth-copy">
          <p className="auth-overline">
            <ShieldCheck className="h-3.5 w-3.5" /> Password Reset
          </p>
          <h1>Set your new password.</h1>
          <p>
            Choose a strong password. It must be at least 8 characters long.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>New password</span>
            <div className={`auth-input ${errors.password ? "auth-input-error" : ""}`}>
              <KeyRound className="h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                }}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                  padding: "0 4px",
                  fontSize: "11px",
                }}
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
            {errors.password && (
              <p
                style={{
                  color: "var(--error, #ef4444)",
                  fontSize: "12px",
                  marginTop: 4,
                }}
              >
                {errors.password}
              </p>
            )}
            <PasswordMeter password={password} />
          </label>

          <label>
            <span>Confirm new password</span>
            <div className={`auth-input ${errors.confirmPassword ? "auth-input-error" : ""}`}>
              <LockKeyhole className="h-4 w-4" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                }}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
            </div>
            {errors.confirmPassword && (
              <p
                style={{
                  color: "var(--error, #ef4444)",
                  fontSize: "12px",
                  marginTop: 4,
                }}
              >
                {errors.confirmPassword}
              </p>
            )}
          </label>

          {/* Password requirements */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: "12px",
              color: "var(--fg-muted)",
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: "var(--fg)" }}>Password requirements:</strong>
            <ul
              style={{
                margin: "4px 0 0",
                paddingLeft: 16,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <li style={{ color: password.length >= 8 ? "var(--success, #10b981)" : "inherit" }}>
                {password.length >= 8 ? "✓" : "○"} At least 8 characters
              </li>
              <li style={{ color: password.length <= 128 && password.length > 0 ? "var(--success, #10b981)" : "inherit" }}>
                {password.length <= 128 && password.length > 0 ? "✓" : "○"} Fewer than 128 characters
              </li>
              <li style={{ color: (password === confirmPassword && password.length > 0) ? "var(--success, #10b981)" : "inherit" }}>
                {password === confirmPassword && password.length > 0 ? "✓" : "○"} Passwords match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className="auth-submit btn btn-solid"
            disabled={isSubmitting || !password || !confirmPassword}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Updating password…" : "Set new password"}
          </button>
        </form>

        <div className="auth-trust" style={{ marginTop: "24px" }}>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secured by Supabase Auth · End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}

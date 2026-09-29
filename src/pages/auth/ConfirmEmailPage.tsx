import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useToast } from "../../components/Auth/Toast";
import { Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";

/**
 * ConfirmEmailPage
 *
 * Handles the email confirmation callback from Supabase.
 * When a user clicks the "Confirm Email" button in their inbox,
 * Supabase redirects them here with a token in the URL hash.
 *
 * Supabase's detectSessionInUrl=true (in supabaseClient.ts) automatically
 * exchanges the token for a session and fires onAuthStateChange(SIGNED_IN).
 *
 * This page just provides visual feedback during and after that process.
 */
export function ConfirmEmailPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Check if there's an error in the URL (e.g. expired link)
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(hash.replace("#", "?"));
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      const desc = errorDescription?.replace(/\+/g, " ") || "Invalid or expired confirmation link.";
      setErrorMessage(desc);
      setState("error");
      return;
    }

    // Listen for the SIGNED_IN event triggered by the confirmation token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") {
          setState("success");
          showToast("Email confirmed! Welcome to CareOS 🎉", "success");
          // Redirect to dashboard after a short delay
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      }
    );

    // Also check if already confirmed (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setState("success");
        setTimeout(() => navigate("/", { replace: true }), 1500);
      } else {
        // No session and no error — give time for hash token to process
        setTimeout(() => {
          setState((prev) => {
            if (prev === "loading") {
              setErrorMessage("Confirmation failed. The link may have expired or already been used.");
              return "error";
            }
            return prev;
          });
        }, 5000);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, showToast]);

  if (state === "loading") {
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
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--fg)", margin: "0 0 8px" }}>
              Confirming your email…
            </h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "14px" }}>
              Please wait while we verify your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "success") {
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
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "#ecfdf5", border: "2px solid #10b981",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <CheckCircle2 className="h-9 w-9" style={{ color: "#10b981" }} />
            </div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px", color: "var(--fg)" }}>
              Email confirmed!
            </h1>
            <p style={{ color: "var(--fg-muted)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 24px" }}>
              Your account is now active. You'll be redirected to your dashboard in a moment.
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

  // Error state
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
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "#fef2f2", border: "2px solid #fecaca",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <span style={{ fontSize: 32 }}>✕</span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, margin: "0 0 12px", color: "var(--fg)" }}>
            Confirmation failed
          </h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "14px", lineHeight: 1.7, margin: "0 0 24px" }}>
            {errorMessage}
          </p>
          <p style={{ color: "var(--fg-muted)", fontSize: "13px", lineHeight: 1.6, margin: "0 0 24px" }}>
            Sign in to request a new confirmation email, or contact support if the problem persists.
          </p>
          <button
            className="btn btn-solid"
            onClick={() => navigate("/")}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

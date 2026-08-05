import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound } from "lucide-react";

export type AuthMode = "sign-in" | "sign-up" | "reset";

export interface AuthUser {
  name: string;
  email: string;
}

interface AuthPageProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuthenticated: (user: AuthUser) => void;
  onContinueAsGuest: () => void;
}

export function AuthPage({ mode, onModeChange, onAuthenticated, onContinueAsGuest }: AuthPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!email.trim()) {
      setMessage("Enter an email address to continue.");
      return;
    }

    if (mode === "reset") {
      setMessage("If an account exists for this email, a reset link would be sent here.");
      return;
    }

    if (password.length < 6) {
      setMessage("Use a password with at least 6 characters.");
      return;
    }

    if (mode === "sign-up" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    onAuthenticated({
      name: name.trim() || email.split("@")[0] || "ViteLens user",
      email: email.trim().toLowerCase(),
    });
  }

  const isReset = mode === "reset";
  const isSignUp = mode === "sign-up";

  return (
    <div className="auth-screen">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-art-orb auth-art-orb-one" />
        <div className="auth-art-orb auth-art-orb-two" />
        <div className="auth-art-grid" />
        <div className="auth-art-card auth-art-card-one"><span>Data quality</span><strong>98.4%</strong><i /></div>
        <div className="auth-art-card auth-art-card-two"><span><span className="auth-art-live" /> Live cohort</span><strong>2,847</strong></div>
      </div>

      <div className="auth-panel">
        <button type="button" className="auth-back" onClick={onContinueAsGuest}><ArrowLeft className="h-4 w-4" /> Back to ViteLens</button>
        <div className="auth-brand"><span className="security-brand-mark" /><span>ViteLens</span></div>
        <div className="auth-copy">
          <p className="auth-overline"><Sparkles className="h-3.5 w-3.5" /> Clinical data intelligence</p>
          <h1>{isReset ? "Reset your access." : isSignUp ? "Create your workspace." : "Welcome back."}</h1>
          <p>{isReset ? "Enter your email and we’ll help you get back into your ViteLens workspace." : "Keep your analysis workspace close, your files local, and your next decision clear."}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp ? <label><span>Full name</span><div className="auth-input"><UserRound className="h-4 w-4" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" /></div></label> : null}
          <label><span>Email address</span><div className="auth-input"><Mail className="h-4 w-4" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required /></div></label>
          {!isReset ? <label><span>Password</span><div className="auth-input"><KeyRound className="h-4 w-4" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" autoComplete={isSignUp ? "new-password" : "current-password"} required /></div></label> : null}
          {isSignUp ? <label><span>Confirm password</span><div className="auth-input"><LockKeyhole className="h-4 w-4" /><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" required /></div></label> : null}
          {message ? <p className="auth-message" role="status">{message}</p> : null}
          <button type="submit" className="auth-submit">{isReset ? "Send reset link" : isSignUp ? "Create account" : "Sign in"}<ArrowRight className="h-4 w-4" /></button>
        </form>

        <div className="auth-switch">
          {isReset ? <button type="button" onClick={() => { setMessage(null); onModeChange("sign-in"); }}>Back to sign in</button> : <><span>{isSignUp ? "Already have an account?" : "New to ViteLens?"}</span><button type="button" onClick={() => { setMessage(null); onModeChange(isSignUp ? "sign-in" : "sign-up"); }}>{isSignUp ? "Sign in" : "Create an account"}</button></>}
        </div>
        {!isSignUp && !isReset ? <button type="button" className="auth-forgot" onClick={() => { setMessage(null); onModeChange("reset"); }}>Forgot password?</button> : null}
        <div className="auth-trust"><ShieldCheck className="h-3.5 w-3.5" /><span>Local demo session · no password is stored by this prototype</span><Check className="h-3.5 w-3.5" /></div>
      </div>
    </div>
  );
}

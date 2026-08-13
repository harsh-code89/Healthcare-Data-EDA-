import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { useToast } from "./Auth/Toast";
import { PasswordMeter } from "./Auth/PasswordMeter";
import { ArrowLeft, ArrowRight, Check, KeyRound, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, Loader2, Github } from "lucide-react";

export type AuthMode = "sign-in" | "sign-up" | "reset" | "otp";

interface AuthPageProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onContinueAsGuest: () => void;
}

export function AuthPage({ mode, onModeChange, onContinueAsGuest }: AuthPageProps) {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // OTP state
  const [otp, setOtp] = useState("");
  const [tempUser, setTempUser] = useState<any>(null); // To hold sign up session before OTP

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      showToast("Enter an email address to continue.", "error");
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "sign-up") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        const session = await authService.signUp(email, password, name);
        setTempUser(session);
        onModeChange("otp");
        showToast("We sent a verification code to your email.", "info");
      } 
      else if (mode === "sign-in") {
        const session = await authService.signIn(email, password);
        login(session, rememberMe);
        showToast(`Welcome back, ${session.user.name}!`, "success");
      } 
      else if (mode === "reset") {
        await authService.resetPasswordRequest(email);
        showToast("If an account exists, a reset link has been sent.", "success");
        onModeChange("sign-in");
      }
      else if (mode === "otp") {
        await authService.verifyOTP(email, otp);
        if (tempUser) {
          login(tempUser, rememberMe);
          showToast(`Account verified! Welcome to ViteLens, ${tempUser.user.name}.`, "success");
        }
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Authentication failed.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "github") {
    setIsLoading(true);
    try {
      const session = await authService.socialSignIn(provider);
      login(session, rememberMe);
      showToast(`Signed in with ${provider} successfully.`, "success");
    } catch (error) {
      showToast(`Failed to sign in with ${provider}.`, "error");
    } finally {
      setIsLoading(false);
    }
  }

  const isReset = mode === "reset";
  const isSignUp = mode === "sign-up";
  const isOtp = mode === "otp";

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
        <button type="button" className="auth-back" onClick={onContinueAsGuest} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4" /> Back to ViteLens
        </button>
        <div className="auth-brand"><span className="security-brand-mark" /><span>ViteLens</span></div>
        <div className="auth-copy">
          <p className="auth-overline"><Sparkles className="h-3.5 w-3.5" /> Clinical data intelligence</p>
          <h1>
            {isOtp ? "Verify your email." : isReset ? "Reset your access." : isSignUp ? "Create your workspace." : "Welcome back."}
          </h1>
          <p>
            {isOtp ? `We sent a code to ${email}. Please enter it below.` : 
             isReset ? "Enter your email and we’ll help you get back into your ViteLens workspace." : 
             "Keep your analysis workspace close, your files local, and your next decision clear."}
          </p>
        </div>

        {(!isReset && !isOtp) && (
          <div className="auth-social">
            <button type="button" className="btn btn-outline" onClick={() => handleSocialLogin("google")} disabled={isLoading} style={{ width: "100%", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 8 }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button type="button" className="btn btn-outline" onClick={() => handleSocialLogin("github")} disabled={isLoading} style={{ width: "100%", justifyContent: "center" }}>
              <Github className="h-4 w-4" style={{ marginRight: 8 }} /> GitHub
            </button>
          </div>
        )}
        
        {(!isReset && !isOtp) && <div className="auth-divider"><span>or continue with email</span></div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isOtp && (
            <>
              {isSignUp ? <label><span>Full name</span><div className="auth-input"><UserRound className="h-4 w-4" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex Morgan" autoComplete="name" disabled={isLoading} /></div></label> : null}
              <label><span>Email address</span><div className="auth-input"><Mail className="h-4 w-4" /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" autoComplete="email" required disabled={isLoading} /></div></label>
              {!isReset ? 
                <label>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><span>Password</span> {!isSignUp && <button type="button" className="auth-forgot" onClick={() => { onModeChange("reset"); }} disabled={isLoading}>Forgot?</button>}</div>
                  <div className="auth-input">
                    <KeyRound className="h-4 w-4" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={isSignUp ? "new-password" : "current-password"} required disabled={isLoading} />
                  </div>
                  {isSignUp && <PasswordMeter password={password} />}
                </label> 
              : null}
              {isSignUp ? <label><span>Confirm password</span><div className="auth-input"><LockKeyhole className="h-4 w-4" /><input type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" autoComplete="new-password" required disabled={isLoading} /></div></label> : null}
              
              {!isReset && !isSignUp && (
                <label style={{ flexDirection: "row", alignItems: "center", gap: "8px", cursor: "pointer", marginTop: "4px" }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} disabled={isLoading} style={{ width: "auto" }} />
                  <span style={{ fontSize: "13px", color: "var(--fg-muted)", fontWeight: 400 }}>Remember me for 7 days</span>
                </label>
              )}
            </>
          )}

          {isOtp && (
            <label><span>Verification code</span><div className="auth-input"><KeyRound className="h-4 w-4" /><input type="text" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="123456" required disabled={isLoading} autoFocus /></div></label>
          )}

          <button type="submit" className="auth-submit btn btn-solid" style={{ width: "100%", justifyContent: "center" }} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isReset ? "Send reset link" : isSignUp ? "Create account" : isOtp ? "Verify & Continue" : "Sign in"}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        <div className="auth-switch">
          {isReset ? <button type="button" onClick={() => onModeChange("sign-in")} disabled={isLoading}>Back to sign in</button> : 
           isOtp ? <button type="button" onClick={() => onModeChange("sign-up")} disabled={isLoading}>Use a different email</button> :
           <><span>{isSignUp ? "Already have an account?" : "New to ViteLens?"}</span><button type="button" onClick={() => onModeChange(isSignUp ? "sign-in" : "sign-up")} disabled={isLoading}>{isSignUp ? "Sign in" : "Create an account"}</button></>}
        </div>
        
        <div className="auth-trust" style={{ marginTop: "24px" }}><ShieldCheck className="h-3.5 w-3.5" /><span>Secure encrypted local session</span><Check className="h-3.5 w-3.5" /></div>
      </div>
    </div>
  );
}

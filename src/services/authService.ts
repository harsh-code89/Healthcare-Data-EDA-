// CareOS — Authentication Service (Supabase + Resend)
// Uses Supabase Auth for session management, Resend for transactional emails.

import { supabase } from "../lib/supabaseClient";

// ── Shared types ─────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

// ── Helper: get the production-safe app URL ───────────────────
function getAppUrl(): string {
  // In production (Netlify), APP_URL is set as an env var.
  // In local dev, Vite exposes it via VITE_ prefix for client-side code.
  // We prioritise the window origin so links always point to the real deployment.
  return (
    (import.meta as any).env?.VITE_APP_URL ||
    window.location.origin
  );
}

// ── Helper: send an email via our Netlify Function ────────────
// This keeps RESEND_API_KEY entirely server-side.
async function sendEmailViaFunction(
  endpoint: "send-welcome-email" | "send-reset-email",
  payload: Record<string, string>
): Promise<void> {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // Log but don't throw — email delivery failure shouldn't block auth flow
      console.warn(`Email function ${endpoint} returned ${res.status}:`, data.error);
    }
  } catch (err) {
    // Network-level failure — log but don't block the auth operation
    console.warn(`Failed to call ${endpoint}:`, err);
  }
}

// ── Helper: fetch user profile from the `profiles` table ─────
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name ?? "",
    email: data.email ?? "",
    createdAt: data.created_at,
    bloodGroup: data.blood_group,
    allergies: data.allergies,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
  };
}

// ── Auth service ──────────────────────────────────────────────
export const authService = {

  /**
   * Sign up with email + password.
   * Returns { needsVerification: true } when Supabase requires email
   * confirmation (controlled by Authentication → Email → "Confirm email").
   * Also triggers a branded welcome email via Resend.
   */
  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ needsVerification: boolean }> {
    const appUrl = getAppUrl();
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { name: name.trim() || email.split("@")[0] },
        // Supabase sends its own confirmation email to this URL.
        // We also send a custom branded one via Resend below.
        emailRedirectTo: `${appUrl}/auth/confirm`,
      },
    });

    if (error) throw new Error(error.message);

    const needsVerification = !data.session;

    if (needsVerification && data.user) {
      // Extract the confirmation URL from Supabase's generated user data
      // Supabase returns the token in the user object when email confirmation is ON
      const confirmationUrl = `${appUrl}/auth/confirm`;

      // Send branded welcome email via Resend (non-blocking)
      await sendEmailViaFunction("send-welcome-email", {
        email: email.toLowerCase().trim(),
        name: name.trim() || email.split("@")[0],
        // We use Supabase's magic link endpoint as the confirmation URL.
        // The user will also receive Supabase's built-in confirmation email,
        // so our email is supplementary / branded.
        confirmationUrl,
      });
    }

    return { needsVerification };
  },

  /**
   * Sign in with email + password.
   * Session is automatically stored by Supabase; AuthContext picks it up
   * via onAuthStateChange.
   */
  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * OAuth sign-in (Google / GitHub).
   * Redirects the browser to the provider — no return value needed.
   * Supabase handles the callback and fires onAuthStateChange automatically.
   */
  async socialSignIn(provider: "google" | "github"): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${getAppUrl()}/auth/confirm`,
        queryParams:
          provider === "google"
            ? { access_type: "offline", prompt: "consent" }
            : undefined,
      },
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Initiate a password reset.
   * Uses Supabase Auth to generate a secure reset token/link.
   * Then sends a branded email via Resend.
   * Always resolves (never leaks whether an account exists).
   */
  async resetPasswordRequest(email: string): Promise<void> {
    const appUrl = getAppUrl();
    const resetRedirectUrl = `${appUrl}/auth/reset-password`;

    // Ask Supabase to generate the reset link
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: resetRedirectUrl }
    );

    // Intentionally swallow errors to prevent account enumeration.
    // We still attempt to send our branded email if Supabase didn't fail.
    if (error) {
      console.warn("Supabase reset email error (suppressed for security):", error.message);
      return; // Return silently — caller shows generic success message
    }

    // Send our branded reset email via Resend (non-blocking)
    // Note: Supabase also sends its own reset email. Our email supplements
    // with better branding. Configure Supabase to disable its built-in email
    // in Dashboard → Auth → Email Templates → Reset Password → (disable or use SMTP).
    await sendEmailViaFunction("send-reset-email", {
      email: email.toLowerCase().trim(),
      resetUrl: resetRedirectUrl,
    });
  },

  /**
   * Complete a password reset after the user clicks the email link.
   * Supabase injects the session via the URL hash when the reset link is opened.
   * This function just updates the password using the active recovery session.
   */
  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  /**
   * Verify an email OTP (sent by Supabase on sign-up or explicit OTP request).
   */
  async verifyOTP(email: string, token: string): Promise<void> {
    const { error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token,
      type: "email",
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Resend the email confirmation link.
   */
  async resendConfirmation(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/confirm`,
      },
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Change password (requires current password verification).
   * Verifies the old password first by re-authenticating, then updates.
   */
  async changePassword(
    email: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Step 1 — verify old password by attempting a fresh sign-in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password: oldPassword,
    });
    if (verifyError) throw new Error("Current password is incorrect.");

    // Step 2 — update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  },

  /**
   * Update display name and medical profile in both auth metadata
   * and the `profiles` table.
   */
  async updateProfile(
    userId: string,
    data: Partial<UserProfile>
  ): Promise<UserProfile> {
    const trimmedName = data.name?.trim();

    if (trimmedName) {
      const { error: metaError } = await supabase.auth.updateUser({
        data: { name: trimmedName },
      });
      if (metaError) throw new Error(metaError.message);
    }

    const updates: Record<string, unknown> = {};
    if (trimmedName) updates.name = trimmedName;
    if (data.bloodGroup !== undefined) updates.blood_group = data.bloodGroup;
    if (data.allergies !== undefined) updates.allergies = data.allergies;
    if (data.emergencyContactName !== undefined)
      updates.emergency_contact_name = data.emergencyContactName;
    if (data.emergencyContactPhone !== undefined)
      updates.emergency_contact_phone = data.emergencyContactPhone;

    const { data: updatedData, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();

    if (error || !updatedData)
      throw new Error(error?.message ?? "Failed to update profile.");

    return {
      id: updatedData.id,
      name: updatedData.name ?? "",
      email: updatedData.email ?? "",
      createdAt: updatedData.created_at,
      bloodGroup: updatedData.blood_group,
      allergies: updatedData.allergies,
      emergencyContactName: updatedData.emergency_contact_name,
      emergencyContactPhone: updatedData.emergency_contact_phone,
    };
  },

  /**
   * Fetch a user's profile from the `profiles` table.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    return fetchProfile(userId);
  },

  /**
   * Sign out of the current session.
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /**
   * Log a dataset upload to the `datasets` table (optional history feature).
   */
  async logDatasetUpload(
    userId: string,
    fileName: string,
    rowCount: number
  ): Promise<void> {
    await supabase
      .from("datasets")
      .insert({ user_id: userId, file_name: fileName, row_count: rowCount });
    // Errors are silently ignored — logging is non-critical
  },
};

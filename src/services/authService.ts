// ViteLens — Authentication Service (Supabase)
// Replaces the previous mock/localStorage implementation with real Supabase Auth.

import { supabase } from "../lib/supabaseClient";

// ── Shared types ─────────────────────────────────────────────
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// ── Helper: fetch user profile from the `profiles` table ─────
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name ?? "",
    email: data.email ?? "",
    createdAt: data.created_at,
  };
}

// ── Auth service ──────────────────────────────────────────────
export const authService = {

  /**
   * Sign up with email + password.
   * Returns { needsVerification: true } when Supabase requires email confirmation
   * (controlled by Authentication → Email → "Confirm email" in Supabase dashboard).
   */
  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ needsVerification: boolean }> {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { name: name.trim() || email.split("@")[0] },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw new Error(error.message);

    // If `session` is null, Supabase requires email confirmation before sign-in
    return { needsVerification: !data.session };
  },

  /**
   * Sign in with email + password.
   * Session is automatically stored by Supabase; AuthContext picks it up via onAuthStateChange.
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
        redirectTo: window.location.origin,
        queryParams: provider === "google"
          ? { access_type: "offline", prompt: "consent" }
          : undefined,
      },
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Send a password reset email.
   * Always resolves (never leaks whether an account exists).
   */
  async resetPasswordRequest(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      { redirectTo: `${window.location.origin}?reset=true` }
    );
    // We intentionally swallow errors here to prevent email enumeration
    if (error) console.warn("Reset email error (suppressed):", error.message);
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
   * Change password.
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
   * Update display name in both auth metadata and the `profiles` table.
   */
  async updateProfile(userId: string, name: string): Promise<UserProfile> {
    const trimmedName = name.trim();

    // Update auth user metadata (so OAuth providers show correct name)
    const { error: metaError } = await supabase.auth.updateUser({
      data: { name: trimmedName },
    });
    if (metaError) throw new Error(metaError.message);

    // Update profiles table
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: trimmedName })
      .eq("id", userId)
      .select("id, name, email, created_at")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to update profile.");

    return {
      id: data.id,
      name: data.name ?? "",
      email: data.email ?? "",
      createdAt: data.created_at,
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

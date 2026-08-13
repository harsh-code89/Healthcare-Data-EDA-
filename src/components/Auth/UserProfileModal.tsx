import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { useToast } from "./Toast";
import { X, UserRound, LockKeyhole, Mail, Activity, LogOut, Check } from "lucide-react";

interface UserProfileModalProps {
  onClose: () => void;
}

type Tab = "profile" | "security" | "session";

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [isUpdating, setIsUpdating] = useState(false);

  // Security state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsUpdating(true);
    try {
      // Pass user.id (Supabase UUID), not email
      const updated = await authService.updateProfile(user!.id, name);
      updateUser(updated);
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update profile.", "error");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    setIsChangingPassword(true);
    try {
      await authService.changePassword(user!.email, oldPassword, newPassword);
      showToast("Password changed successfully.", "success");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to change password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Account Settings</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="btn btn-ghost btn-sm" style={{ padding: "4px" }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="modal-tabs">
          <button type="button" className={`modal-tab ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
            <UserRound className="h-3.5 w-3.5" /> Profile
          </button>
          <button type="button" className={`modal-tab ${activeTab === "security" ? "active" : ""}`} onClick={() => setActiveTab("security")}>
            <LockKeyhole className="h-3.5 w-3.5" /> Security
          </button>
          <button type="button" className={`modal-tab ${activeTab === "session" ? "active" : ""}`} onClick={() => setActiveTab("session")}>
            <Activity className="h-3.5 w-3.5" /> Session
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="auth-form" style={{ gap: "16px", padding: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
                <span className="hfy-user-avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", color: "var(--fg)" }}>{user.name}</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--fg-muted)" }}>{user.email}</p>
                </div>
              </div>
              <label>
                <span>Full name</span>
                <div className="auth-input">
                  <UserRound className="h-4 w-4" />
                  <input value={name} onChange={(e) => setName(e.target.value)} disabled={isUpdating} required />
                </div>
              </label>
              <label>
                <span>Email address</span>
                <div className="auth-input">
                  <Mail className="h-4 w-4" />
                  <input value={user.email} disabled style={{ opacity: 0.6 }} />
                </div>
                <small style={{ color: "var(--fg-muted)", fontSize: "12px", marginTop: "4px", display: "block" }}>Email cannot be changed.</small>
              </label>
              <button type="submit" className="btn btn-solid" style={{ width: "100%", justifyContent: "center" }} disabled={isUpdating || name === user.name}>
                {isUpdating ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="auth-form" style={{ gap: "16px", padding: 0 }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--fg-muted)", lineHeight: 1.5 }}>
                Ensure your account is using a long, random password to stay secure.
              </p>
              <label>
                <span>Current password</span>
                <div className="auth-input">
                  <LockKeyhole className="h-4 w-4" />
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required disabled={isChangingPassword} />
                </div>
              </label>
              <label>
                <span>New password</span>
                <div className="auth-input">
                  <LockKeyhole className="h-4 w-4" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isChangingPassword} />
                </div>
              </label>
              <button type="submit" className="btn btn-solid" style={{ width: "100%", justifyContent: "center" }} disabled={isChangingPassword || !oldPassword || !newPassword}>
                {isChangingPassword ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          {activeTab === "session" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="session-info-card">
                <p><strong>Account created</strong></p>
                <p>{new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div className="session-info-card">
                <p><strong>Active session</strong></p>
                <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="preview-status-dot" /> Supabase Auth — encrypted JWT session
                </p>
              </div>
              
              <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "8px 0" }} />
              
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: "var(--rose)", borderColor: "var(--rose)", width: "100%", justifyContent: "center" }}
                onClick={async () => { onClose(); await logout(); }}
              >
                <LogOut className="h-4 w-4" /> Sign out of ViteLens
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

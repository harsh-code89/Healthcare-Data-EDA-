import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { useToast } from "./Toast";
import { X, UserRound, LockKeyhole, Mail, Activity, LogOut, ShieldAlert, Droplet } from "lucide-react";
import clsx from "clsx";

interface UserProfileModalProps {
  onClose: () => void;
}

type Tab = "profile" | "medical" | "security";

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { user, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Profile state
  const [name, setName] = useState(user?.name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Medical state
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || "");
  const [allergies, setAllergies] = useState(user?.allergies || "");
  const [ecName, setEcName] = useState(user?.emergencyContactName || "");
  const [ecPhone, setEcPhone] = useState(user?.emergencyContactPhone || "");
  const [isUpdatingMedical, setIsUpdatingMedical] = useState(false);

  // Security state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsUpdatingProfile(true);
    try {
      const updated = await authService.updateProfile(user!.id, { name });
      updateUser(updated);
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update profile.", "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleUpdateMedical(e: FormEvent) {
    e.preventDefault();
    setIsUpdatingMedical(true);
    try {
      const updated = await authService.updateProfile(user!.id, {
        bloodGroup,
        allergies,
        emergencyContactName: ecName,
        emergencyContactPhone: ecPhone
      });
      updateUser(updated);
      showToast("Medical profile updated successfully.", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update medical profile.", "error");
    } finally {
      setIsUpdatingMedical(false);
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="font-bold text-slate-800">Account Settings</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="flex border-b border-slate-200">
          <button 
            type="button" 
            className={clsx("flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2", activeTab === "profile" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:bg-slate-50")} 
            onClick={() => setActiveTab("profile")}
          >
            <UserRound className="h-4 w-4" /> Profile
          </button>
          <button 
            type="button" 
            className={clsx("flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2", activeTab === "medical" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:bg-slate-50")} 
            onClick={() => setActiveTab("medical")}
          >
            <Activity className="h-4 w-4" /> Medical
          </button>
          <button 
            type="button" 
            className={clsx("flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2", activeTab === "security" ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:bg-slate-50")} 
            onClick={() => setActiveTab("security")}
          >
            <LockKeyhole className="h-4 w-4" /> Security
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-2xl font-bold">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{user.name}</h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isUpdatingProfile} required className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative opacity-60">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input type="text" value={user.email} disabled className="w-full pl-10 p-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed directly.</p>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <button type="submit" className="co-btn co-btn-primary w-full justify-center" disabled={isUpdatingProfile || name === user.name}>
                  {isUpdatingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "medical" && (
            <form onSubmit={handleUpdateMedical} className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">Update your core medical and emergency information.</p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Droplet className="h-4 w-4 text-rose-500" />
                  </div>
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} disabled={isUpdatingMedical} className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500">
                    <option value="">Unknown / Prefer not to say</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Known Allergies</label>
                <textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} disabled={isUpdatingMedical} rows={2} className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="E.g. Penicillin, Peanuts, None"></textarea>
              </div>

              <div className="pt-2">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-4 w-4 text-amber-500" /> Emergency Contact
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Name</label>
                    <input type="text" value={ecName} onChange={(e) => setEcName(e.target.value)} disabled={isUpdatingMedical} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="Full Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                    <input type="tel" value={ecPhone} onChange={(e) => setEcPhone(e.target.value)} disabled={isUpdatingMedical} className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <button type="submit" className="co-btn co-btn-primary w-full justify-center" disabled={isUpdatingMedical}>
                  {isUpdatingMedical ? "Saving..." : "Save Medical Profile"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Ensure your account is using a long, random password to stay secure.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                  </div>
                  <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required disabled={isChangingPassword} className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockKeyhole className="h-4 w-4 text-slate-400" />
                  </div>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isChangingPassword} className="w-full pl-10 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6 space-y-4">
                <button type="submit" className="co-btn co-btn-primary w-full justify-center" disabled={isChangingPassword || !oldPassword || !newPassword}>
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </button>

                <div className="p-4 bg-red-50 rounded-lg border border-red-100 mt-6">
                  <h4 className="text-red-800 font-medium mb-1">Danger Zone</h4>
                  <p className="text-xs text-red-600 mb-3">Sign out of all devices and current session.</p>
                  <button type="button" onClick={async () => { onClose(); await logout(); }} className="co-btn co-btn-ghost w-full justify-center text-red-600 hover:bg-red-100 hover:text-red-700">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

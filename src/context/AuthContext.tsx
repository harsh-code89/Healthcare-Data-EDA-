import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type AuthSession, type UserProfile } from "../services/authService";
import { useToast } from "../components/Auth/Toast";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: AuthSession, rememberMe: boolean) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

const SESSION_KEY = "vitelens-auth-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // On mount, restore session if valid
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);
        if (session.expiresAt > Date.now()) {
          setUser(session.user);
        } else {
          // Session expired
          localStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_KEY);
          showToast("Your session has expired. Please log in again.", "info");
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const login = (session: AuthSession, rememberMe: boolean) => {
    setUser(session.user);
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    showToast("You have been logged out.", "success");
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    const storage = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
    const stored = storage.getItem(SESSION_KEY);
    if (stored) {
      const session: AuthSession = JSON.parse(stored);
      session.user = updatedUser;
      storage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

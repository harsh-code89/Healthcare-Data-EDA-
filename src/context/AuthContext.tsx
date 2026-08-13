import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { authService, type UserProfile } from "../services/authService";
import { useToast } from "../components/Auth/Toast";

// ── Context shape ─────────────────────────────────────────────
interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

// ── Provider ──────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Build a UserProfile from a Supabase user object when the profiles table
  // is unavailable (e.g. before the SQL migration has been run).
  function fallbackProfile(supabaseUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
    created_at: string;
  }): UserProfile {
    return {
      id: supabaseUser.id,
      name:
        supabaseUser.user_metadata?.name ||
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.email?.split("@")[0] ||
        "User",
      email: supabaseUser.email ?? "",
      createdAt: supabaseUser.created_at,
    };
  }

  const resolveUser = useCallback(
    async (supabaseUser: {
      id: string;
      email?: string;
      user_metadata?: Record<string, string>;
      created_at: string;
    }) => {
      const profile = await authService.getProfile(supabaseUser.id);
      setUser(profile ?? fallbackProfile(supabaseUser));
    },
    []
  );

  useEffect(() => {
    // ── 1. Restore session on page load ──────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await resolveUser(session.user as Parameters<typeof resolveUser>[0]);
      }
      setIsLoading(false);
    });

    // ── 2. Subscribe to all future auth state changes ────────
    // This fires for: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED,
    //                 PASSWORD_RECOVERY, USER_UPDATED
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await resolveUser(session.user as Parameters<typeof resolveUser>[0]);

        if (event === "PASSWORD_RECOVERY") {
          showToast(
            "You can now set a new password in Account Settings.",
            "info"
          );
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [resolveUser, showToast]);

  const logout = async () => {
    try {
      await authService.signOut();
    } catch {
      // Force local state clear even if sign-out call fails
    }
    setUser(null);
    showToast("You have been logged out.", "success");
  };

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

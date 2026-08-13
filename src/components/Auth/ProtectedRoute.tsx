import { type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  onRequireAuth: () => void;
}

export function ProtectedRoute({ children, onRequireAuth }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--fg-muted)" }}>
        <Loader2 className="h-6 w-6 animate-spin" />
        <span style={{ marginLeft: "12px" }}>Loading workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // We defer the state update to avoid React warnings during render
    setTimeout(() => {
      onRequireAuth();
    }, 0);
    return null;
  }

  return <>{children}</>;
}

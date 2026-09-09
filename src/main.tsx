import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { ToastProvider } from "./components/Auth/Toast";
import { AuthProvider } from "./context/AuthContext";

// Clear old mock localStorage data if present
try {
  // Clear any legacy ViteLens or old CareOS mock data keys
  localStorage.removeItem("vitelens-mock-users");
  localStorage.removeItem("vitelens-auth-session");
  sessionStorage.removeItem("vitelens-auth-session");
  localStorage.removeItem("careos-mock-users");
  sessionStorage.removeItem("careos-auth-session");
} catch {}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
);

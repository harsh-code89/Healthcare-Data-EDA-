import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { ToastProvider } from "./components/Auth/Toast";
import { AuthProvider } from "./context/AuthContext";

// Clear old mock localStorage data if present
try {
  localStorage.removeItem("vitelens-mock-users");
  localStorage.removeItem("vitelens-auth-session");
  sessionStorage.removeItem("vitelens-auth-session");
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

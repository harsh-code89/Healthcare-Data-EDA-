import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  
  return (
    <AppContext.Provider value={{ 
      sidebarOpen, setSidebarOpen, 
      isDark, setIsDark 
    }}>
      {children}
    </AppContext.Provider>
  );
}

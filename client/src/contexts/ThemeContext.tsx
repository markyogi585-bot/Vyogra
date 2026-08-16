import type { ReactNode } from "react";

type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  switchable: boolean;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

/**
 * Compatibility boundary retained for an old internal showcase route and any
 * stale development-preview module. VOYAGR has one intentional light native
 * surface, so this component must remain hook-free: it cannot introduce a
 * second React dispatcher into a cached Vite module graph.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>;
}

export function useTheme(): ThemeContextType {
  return {
    theme: "light",
    toggleTheme: () => undefined,
    switchable: false,
  };
}

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "dark", // Default to dark mode
      setTheme: (theme: Theme) => {
        set({ theme });
        // Apply theme class to document root
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === "light" ? "dark" : "light";
        get().setTheme(newTheme);
      },
    }),
    {
      name: "vlab-theme-storage",
      onRehydrateStorage: () => (state) => {
        // Apply theme on page load
        if (state?.theme) {
          document.documentElement.classList.remove("light", "dark");
          document.documentElement.classList.add(state.theme);
        }
      },
    },
  ),
);

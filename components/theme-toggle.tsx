"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ui/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme} 
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} 
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-brand-line bg-brand-canvas text-brand-muted transition-all duration-300 hover:border-brand-lime hover:text-brand-ink active:scale-90 dark:border-brand-line dark:bg-brand-ink dark:text-brand-muted dark:hover:border-brand-lime dark:hover:text-brand-ink"
    >
      <div className="relative h-5 w-5">
        {theme === "light" ? (
          <Moon className="h-full w-full transition-all duration-300 ease-in-out group-hover:rotate-12" />
        ) : (
          <Sun className="h-full w-full transition-all duration-300 ease-in-out group-hover:rotate-12" />
        )}
      </div>
      {/* Subtle Glow Effect */}
      <span className="absolute inset-0 rounded-full bg-brand-lime/0 transition-all duration-300 group-hover:bg-brand-lime/10" />
    </button>
  );
}

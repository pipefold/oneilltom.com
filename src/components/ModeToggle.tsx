import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  // Internal state: "system" means use system preference, "light"/"dark" means manual choice
  const [theme, setThemeState] = React.useState<"system" | "light" | "dark">(
    "system"
  );

  React.useEffect(() => {
    // Check if user has previously made a manual choice
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
    } else {
      // No saved preference - use system preference
      setThemeState("system");
    }
  }, []);

  // Listen for system preference changes when in system mode
  React.useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Force re-render to update the effective theme
      setThemeState("system");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    // Determine effective theme
    let effectiveTheme: "light" | "dark";
    if (theme === "system") {
      // Use system preference
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      // Use manual choice
      effectiveTheme = theme;
    }

    root.classList.add(effectiveTheme);

    // Only store manual choices, not system preference
    if (theme !== "system") {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    // If currently on system, switch to the opposite of current system preference
    if (theme === "system") {
      const isSystemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setThemeState(isSystemDark ? "light" : "dark");
    } else {
      // Toggle between light and dark
      setThemeState(theme === "light" ? "dark" : "light");
    }
  };

  const getIcon = () => {
    // Show icon based on effective theme (system preference until manual choice)
    let effectiveTheme: "light" | "dark";
    if (theme === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } else {
      effectiveTheme = theme;
    }

    return effectiveTheme === "dark" ? (
      <Moon className="h-[1.2rem] w-[1.2rem]" />
    ) : (
      <Sun className="h-[1.2rem] w-[1.2rem]" />
    );
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

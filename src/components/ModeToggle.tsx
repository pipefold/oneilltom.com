import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const [theme, setThemeState] = React.useState<"light" | "dark" | "system">(
    "system"
  );

  React.useEffect(() => {
    // Check if user has previously made a choice
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setThemeState(savedTheme as "light" | "dark" | "system");
    } else {
      // Default to system if no previous choice
      setThemeState("system");
    }
  }, []);

  React.useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList[isDark ? "add" : "remove"]("dark");

    // Save the theme choice to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  const cycleTheme = () => {
    if (theme === "system") {
      // If currently on system, switch to light
      setThemeState("light");
    } else if (theme === "light") {
      // If currently on light, switch to dark
      setThemeState("dark");
    } else {
      // If currently on dark, switch to light
      setThemeState("light");
    }
  };

  const getIcon = () => {
    // Always show sun/moon based on current effective theme
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    return isDark ? (
      <Moon className="h-[1.2rem] w-[1.2rem]" />
    ) : (
      <Sun className="h-[1.2rem] w-[1.2rem]" />
    );
  };

  return (
    <Button variant="outline" size="icon" onClick={cycleTheme}>
      {getIcon()}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

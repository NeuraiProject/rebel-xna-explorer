import * as React from "react";
import { loadSettings } from "./useSettings";

export type Theme = "light" | "dark";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

//Only a theme the user picked with the toggle is saved under "theme"
function savedTheme(): Theme | null {
  const saved = readStorage("theme");
  return saved === "light" || saved === "dark" ? saved : null;
}

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = React.useState<Theme>(currentTheme);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  //The configured theme is the default until the user picks one
  React.useEffect(() => {
    loadSettings()
      .then((settings) => {
        if (settings.theme === "light" || settings.theme === "dark") {
          writeStorage("theme-default", settings.theme);
          if (!savedTheme()) setTheme(settings.theme);
        }
      })
      .catch(() => {});
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((previous) => {
      const next = previous === "dark" ? "light" : "dark";
      writeStorage("theme", next);
      return next;
    });
  }, []);

  return [theme, toggle];
}

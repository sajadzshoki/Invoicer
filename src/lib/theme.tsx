import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
/** ترجیح کاربر: روشن، تاریک یا پیروی از سیستم (فاز ۷) */
export type ThemePreference = Theme | "system";

const STORAGE_KEY = "nasagh:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

interface ThemeContextValue {
  /** تم اعمال‌شدهٔ فعلی (برای «سیستم» مقدار واقعی سیستم است) */
  theme: Theme;
  /** ترجیح ذخیره‌شدهٔ کاربر */
  preference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  setPreference: (p: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemIsDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(DARK_QUERY).matches;
}

function readInitialPreference(): ThemePreference {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark" || attr === "light" || attr === "system") return attr;
  }
  return "light";
}

function resolve(preference: ThemePreference): Theme {
  return preference === "system" ? (systemIsDark() ? "dark" : "light") : preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readInitialPreference);
  const [theme, setThemeState] = useState<Theme>(() => resolve(readInitialPreference()));

  // اعمال تم به سند و ذخیرهٔ ترجیح
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* دسترسی به حافظهٔ محلی ممکن است مسدود باشد */
    }
  }, [theme, preference]);

  // پیگیری تغییر تم سیستم وقتی ترجیح «سیستم» است
  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined" || !window.matchMedia) {
      return;
    }
    const mql = window.matchMedia(DARK_QUERY);
    const onChange = () => setThemeState(systemIsDark() ? "dark" : "light");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    setThemeState(resolve(p));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setPreferenceState(t);
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => {
      const next: Theme = t === "light" ? "dark" : "light";
      setPreferenceState(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, preference, toggleTheme, setTheme, setPreference }),
    [theme, preference, toggleTheme, setTheme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme باید داخل ThemeProvider استفاده شود");
  return ctx;
}

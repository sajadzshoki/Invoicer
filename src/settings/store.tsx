/**
 * استور تنظیمات (فاز ۷)
 *
 * تنها نقطهٔ خواندن/نوشتن «تنظیمات». صفحه‌ها و ماژول‌ها تنظیمات را فقط از
 * این استور می‌خوانند تا خواندن‌های تکراری از localStorage پخش نشود.
 * این استور هیچ دادهٔ مالی یا تراکنشی نگه نمی‌دارد.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "./defaults";
import { normalizeSettings } from "./normalize";
import { applyFormatConfig } from "./formatConfig";
import type { AppSettings } from "./types";

interface SettingsStoreValue {
  settings: AppSettings;
  /** ادغام عمیق یک وصله روی تنظیمات فعلی */
  update: (patch: (prev: AppSettings) => AppSettings) => void;
  /** بازگردانی همهٔ تنظیمات به پیش‌فرض (داده‌های کسب‌وکار دست‌نخورده می‌مانند) */
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsStoreValue | null>(null);

function loadInitial(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

/** همگام‌سازی پیکربندی نمایشِ توابع قالب‌بندی با تنظیمات */
function syncFormatConfig(s: AppSettings): void {
  applyFormatConfig({
    currency: s.financial.currency,
    digits: s.financial.digits,
    dateSystem: s.financial.dateSystem,
    thousandSeparator: s.financial.thousandSeparator,
    lowStockWarning: s.inventory.lowStockWarning,
  });
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadInitial);

  // همگام‌سازی اولیهٔ پیکربندی نمایش (برای اطمینان پس از مونت)
  useEffect(() => {
    syncFormatConfig(settings);
  }, [settings]);

  // ذخیرهٔ هم‌زمان در حافظهٔ محلی
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* دسترسی به حافظهٔ محلی ممکن است مسدود باشد */
    }
  }, [settings]);

  const update = useCallback(
    (patch: (prev: AppSettings) => AppSettings) => {
      setSettings((prev) => normalizeSettings(patch(prev)));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(structuredClone(DEFAULT_SETTINGS));
  }, []);

  const value = useMemo(
    () => ({ settings, update, resetSettings }),
    [settings, update, resetSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

/** دسترسی مشترک به تنظیمات — همهٔ صفحه‌ها از همین هوک استفاده می‌کنند */
export function useSettings(): SettingsStoreValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings باید داخل SettingsProvider استفاده شود");
  }
  return ctx;
}

/** فقط خواندن تنظیمات (بدون توابع به‌روزرسانی) */
export function useAppSettings(): AppSettings {
  return useSettings().settings;
}

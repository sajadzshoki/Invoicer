import { useEffect, useMemo, useRef } from "react";
import { registerDirtyGuard, unregisterDirtyGuard, type DirtyGuard } from "./navGuard";

/**
 * هوک تغییرات ذخیره‌نشده برای صفحه‌های تنظیمات:
 * - ثبت محافظ برای ناوبری اصلی اپ
 * - هشدار بستن/ریلود صفحهٔ مرورگر هنگام تغییرات ذخیره‌نشده
 *
 * خروجی: `guardBack` برای استفاده در دکمهٔ بازگشت صفحه — اگر تغییر
 * ذخیره‌نشده نباشد مستقیم برمی‌گردد، در غیر این صورت با `onBlocked`
 * به صفحه اجازه می‌دهد برگهٔ تأیید را باز کند.
 */
export function useUnsavedChanges(dirty: boolean, save: () => void) {
  const saveRef = useRef(save);
  const dirtyRef = useRef(dirty);
  saveRef.current = save;
  dirtyRef.current = dirty;

  const guard = useMemo<DirtyGuard>(
    () => ({
      isDirty: () => dirtyRef.current,
      save: () => saveRef.current(),
    }),
    []
  );

  useEffect(() => {
    registerDirtyGuard(guard);
    return () => unregisterDirtyGuard(guard);
  }, [guard]);

  // هشدار بستن یا ریلود مرورگر
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const guardBack = (onBlocked: () => void, fallback: () => void) => {
    if (dirtyRef.current) onBlocked();
    else fallback();
  };

  return { guardBack };
}

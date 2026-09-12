/**
 * محافظ خروج با تغییرات ذخیره‌نشده (فاز ۷)
 *
 * صفحه‌های فرم‌دار (مثل اطلاعات کسب‌وکار) یک محافظ ثبت می‌کنند؛ ناوبری
 * اصلی اپ (سایدبار/ناوبری پایین) و دکمهٔ بازگشت قبل از خروج، وضعیت
 * ذخیره‌نشدن را می‌پرسند. سه انتخاب: ذخیره و خروج / خروج بدون ذخیره / انصراف.
 */

export interface DirtyGuard {
  /** آیا تغییر ذخیره‌نشده وجود دارد؟ */
  isDirty: () => boolean;
  /** ذخیرهٔ تغییرات جاری */
  save: () => void;
}

let activeGuard: DirtyGuard | null = null;

export function registerDirtyGuard(guard: DirtyGuard): void {
  activeGuard = guard;
}

export function unregisterDirtyGuard(guard: DirtyGuard): void {
  if (activeGuard === guard) activeGuard = null;
}

export function getActiveGuard(): DirtyGuard | null {
  return activeGuard;
}

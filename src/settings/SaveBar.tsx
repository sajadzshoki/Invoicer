import { Button } from "@/components/ui/Button";

/**
 * نوار ذخیرهٔ چسبان برای فرم‌های تنظیمات
 * وقتی تغییری وجود نداشته باشد غیرفعال است تا ذخیرهٔ بیهوده رخ ندهد.
 */
export function SaveBar({
  dirty,
  saving,
  onSave,
}: {
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
}) {
  return (
    <div className="save-bar" role="region" aria-label="ذخیرهٔ تغییرات">
      <div className="save-bar__inner">
        <span className="save-bar__hint">
          {dirty ? "تغییرات ذخیره نشده‌اند." : "همهٔ تغییرات ذخیره شده است."}
        </span>
        <Button onClick={onSave} disabled={!dirty || saving}>
          {saving ? "در حال ذخیره…" : "ذخیرهٔ تغییرات"}
        </Button>
      </div>
    </div>
  );
}

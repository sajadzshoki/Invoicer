import { useState } from "react";
import { Calendar } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Input, Field } from "@/components/ui/Field";
import { ListItem } from "@/components/ui/Card";
import {
  daysAgoIso,
  formatJalaliLong,
  isoToJalali,
  jalaliToIso,
  parseJalaliString,
  todayJalali,
} from "@/lib/jalali";

export interface DateSelectSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** مقدار فعلی به‌صورت ISO */
  value?: string;
  onSelect: (iso: string) => void;
  /** حداقل فاصلهٔ مجاز از امروز (روز)؛ برای تاریخ تولد از آینده جلوگیری می‌کند */
  maxDaysFromToday?: number;
}

const PRESETS: Array<{ label: string; days: number }> = [
  { label: "امروز", days: 0 },
  { label: "دیروز", days: 1 },
  { label: "پریروز", days: 2 },
  { label: "یک هفته پیش", days: 7 },
];

/**
 * انتخاب تاریخ جلالی — میان‌برهای پرکاربرد + ورود دستی تاریخ.
 * تقویم کامل شمسی در فازهای بعدی جایگزین ورود دستی می‌شود.
 */
export function DateSelectSheet({
  open,
  onClose,
  title = "انتخاب تاریخ",
  value,
  onSelect,
  maxDaysFromToday,
}: DateSelectSheetProps) {
  const [manual, setManual] = useState("");
  const [error, setError] = useState<string | undefined>();

  const pick = (iso: string) => {
    setError(undefined);
    setManual("");
    onSelect(iso);
    onClose();
  };

  const submitManual = () => {
    const parsed = parseJalaliString(manual);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const iso = jalaliToIso(parsed.date);
    if (maxDaysFromToday !== undefined) {
      const selected = new Date(iso).getTime();
      const limit = new Date(daysAgoIso(-maxDaysFromToday)).getTime();
      if (selected > limit) {
        setError("این تاریخ نمی‌تواند در آینده باشد.");
        return;
      }
    }
    pick(iso);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <div className="list">
        {PRESETS.map((preset) => {
          const iso = daysAgoIso(preset.days);
          const active = value === iso;
          return (
            <ListItem
              key={preset.label}
              icon={<Calendar size={18} aria-hidden />}
              tintIcon={active}
              title={preset.label}
              caption={formatJalaliLong(isoToJalali(iso)!)}
              onClick={() => pick(iso)}
            />
          );
        })}
      </div>

      <div className="sheet-section">
        <Field
          label="تاریخ دستی"
          hint="با قالب سال/ماه/روز؛ مثل ۱۴۰۵/۰۶/۱۸"
          error={error}
          htmlFor="date-manual"
        >
          <Input
            id="date-manual"
            value={manual}
            invalid={!!error}
            placeholder={formatJalaliShortPlaceholder()}
            inputMode="numeric"
            onChange={(e) => {
              setManual(e.target.value);
              setError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitManual();
            }}
          />
        </Field>
        <Button block className="mt-4" onClick={submitManual} disabled={!manual.trim()}>
          تأیید تاریخ
        </Button>
      </div>
    </BottomSheet>
  );
}

function formatJalaliShortPlaceholder(): string {
  const j = todayJalali();
  const fa = (s: string) =>
    s.replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  return fa(`${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`);
}

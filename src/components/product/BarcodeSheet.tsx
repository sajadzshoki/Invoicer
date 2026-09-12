import { useState } from "react";
import { Barcode, ScanLine } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { toEnDigits } from "@/lib/fa";

export interface BarcodeSheetProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

/**
 * اسکن بارکد — در این فاز شبیه‌سازی است.
 * نقطهٔ اتصال اسکنر بومی (دوربین) در آینده فقط جایگزین این برگه می‌شود.
 */
export function BarcodeSheet({ open, onClose, onScan }: BarcodeSheetProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    const cleaned = toEnDigits(code).replace(/\s/g, "");
    if (!cleaned) {
      setError("بارکد را وارد کنید.");
      return;
    }
    if (!/^\d{6,20}$/.test(cleaned)) {
      setError("بارکد باید فقط عدد و بین ۶ تا ۲۰ رقم باشد.");
      return;
    }
    onScan(cleaned);
    setCode("");
    setError(undefined);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="اسکن بارکد">
      {/* قاب نمایشی اسکنر — فقط برای نمایش، دوربین واقعی فعال نیست */}
      <div className="scan-frame" aria-hidden>
        <ScanLine size={44} />
        <span className="scan-frame__line" />
        <p className="scan-frame__hint">
          اسکنر دوربین در این نسخه فعال نیست؛ بارکد را دستی وارد کنید.
        </p>
      </div>

      <div className="stack mt-4">
        <Field
          label="بارکد"
          htmlFor="barcode-manual"
          error={error}
          hint="اعداد زیر میله‌های بارکد محصول"
        >
          <Input
            id="barcode-manual"
            value={code}
            invalid={!!error}
            placeholder="مثلاً ۶۲۱۰۰۰۱۱۱۲۲۲۳"
            inputMode="numeric"
            dir="ltr"
            style={{ textAlign: "end" }}
            leading={<Barcode size={20} aria-hidden />}
            onChange={(e) => {
              setCode(e.target.value);
              setError(undefined);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </Field>
        <Button block icon={<Barcode size={18} aria-hidden />} onClick={submit}>
          ثبت بارکد
        </Button>
      </div>
    </BottomSheet>
  );
}

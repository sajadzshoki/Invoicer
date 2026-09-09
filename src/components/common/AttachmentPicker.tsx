import { useRef } from "react";
import { FileText, ImagePlus, Paperclip, RefreshCw, Trash2 } from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import type { ChequeAttachment } from "@/cheques/types";
import { faNum } from "@/lib/fa";

export interface AttachmentPickerProps {
  value?: ChequeAttachment;
  onChange: (value: ChequeAttachment | undefined) => void;
  /** متن راهنمای ماهیت محلی بودن ذخیره‌سازی */
  hint?: string;
}

/**
 * انتخاب پیوست (تصویر یا فایل) — مشترک بین چک‌ها و هزینه‌ها.
 * در این فاز (بدون بک‌اند) پیوست فقط روی همین دستگاه ذخیره می‌شود؛
 * ساختار برای آپلود واقعی در آینده آماده است.
 */
export function AttachmentPicker({ value, onChange, hint }: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (file.type.startsWith("image/")) {
      try {
        const dataUrl = await downscaleImage(file);
        onChange({ name: file.name, dataUrl, kind: "image", size: file.size });
        return;
      } catch {
        // تصویر قابل پردازش نبود؛ به‌عنوان فایل معمولی ذخیره می‌شود
      }
    }
    onChange({ name: file.name, kind: "file", size: file.size });
  };

  return (
    <div className="attachment">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.txt,.csv"
        aria-hidden
        tabIndex={-1}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="attachment__preview">
          {value.kind === "image" && value.dataUrl ? (
            <img src={value.dataUrl} alt={value.name} className="attachment__thumb" />
          ) : (
            <span className="attachment__file-icon" aria-hidden>
              {value.kind === "image" ? <ImagePlus size={20} /> : <FileText size={20} />}
            </span>
          )}
          <div className="attachment__meta">
            <span className="attachment__name">{value.name}</span>
            <span className="attachment__caption">
              {value.size ? `${faNum(Math.max(1, Math.round(value.size / 1024)))} کیلوبایت · ` : ""}
              ذخیره روی همین دستگاه
            </span>
          </div>
          <div className="attachment__actions">
            <IconButton label="جایگزینی پیوست" onClick={pick}>
              <RefreshCw size={16} aria-hidden />
            </IconButton>
            <IconButton
              label="حذف پیوست"
              className="image-picker__remove"
              onClick={() => onChange(undefined)}
            >
              <Trash2 size={16} aria-hidden />
            </IconButton>
          </div>
        </div>
      ) : (
        <button type="button" className="attachment__empty" onClick={pick}>
          <Paperclip size={20} aria-hidden />
          افزودن پیوست (تصویر یا فایل)
        </button>
      )}
      {hint && <p className="attachment__hint">{hint}</p>}
    </div>
  );
}

/** کوچک‌سازی تصویر پیش از ذخیرهٔ محلی — همان الگوی فاز ۳ */
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const maxSide = 512;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image-load"));
    };
    img.src = url;
  });
}

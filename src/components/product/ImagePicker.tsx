import { useRef, useState } from "react";
import { Camera, Trash2, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { useToast } from "@/components/ui/Toast";

export interface ImagePickerProps {
  value?: string;
  onChange: (dataUrl?: string) => void;
}

/** کوچک‌کردن تصویر برای ذخیرهٔ محلی بهینه */
async function downscale(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = raw;
  });

  const MAX = 512;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return raw;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * انتخاب تصویر کالا/خدمت — کاملاً محلی.
 * ساختار طوری است که آپلود واقعی به سرور در آینده فقط با
 * جایگزینی تابع ذخیره‌سازی اضافه می‌شود.
 */
export function ImagePicker({ value, onChange }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const { showToast } = useToast();

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({
        variant: "error",
        title: "فایل انتخابی تصویر نیست",
        description: "یک فایل تصویری مثل JPG یا PNG انتخاب کنید.",
      });
      return;
    }
    setReading(true);
    try {
      const dataUrl = await downscale(file);
      onChange(dataUrl);
    } catch {
      showToast({
        variant: "error",
        title: "خواندن تصویر ناموفق بود",
        description: "تصویر دیگری را امتحان کنید.",
      });
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="image-picker">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        tabIndex={-1}
        onChange={(e) => handleFile(e.target.files?.[0])}
        aria-hidden
      />
      <button
        type="button"
        className={cn("image-picker__tile", value && "image-picker__tile--filled")}
        onClick={pickFile}
        disabled={reading}
        aria-label={value ? "جایگزینی تصویر" : "انتخاب تصویر"}
      >
        {value ? (
          <img src={value} alt="پیش‌نمایش تصویر" />
        ) : (
          <span className="image-picker__placeholder">
            <Camera size={22} aria-hidden />
            <span>{reading ? "در حال خواندن…" : "انتخاب تصویر"}</span>
          </span>
        )}
      </button>
      <div className="image-picker__side">
        <p className="image-picker__hint">
          تصویر فقط روی همین دستگاه ذخیره می‌شود.
        </p>
        {value && (
          <div className="image-picker__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={pickFile}>
              <RefreshCcw size={15} aria-hidden />
              جایگزینی
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm image-picker__remove"
              onClick={() => onChange(undefined)}
            >
              <Trash2 size={15} aria-hidden />
              حذف
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

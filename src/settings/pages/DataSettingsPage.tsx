import { useRef, useState } from "react";
import {
  Database,
  Download,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { faNum, toFaDigits } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";
import { SettingsLayout } from "../SettingsLayout";
import {
  clearAllData,
  downloadBackup,
  parseBackupText,
  restoreBackup,
  restoreDemoData,
  type BackupSummary,
  type BackupFile,
} from "../backup";

/**
 * پشتیبان‌گیری و داده‌ها (فاز ۷)
 * - خروجی: همهٔ مخازن در یک فایل JSON نسخه‌بندی‌شده
 * - بازیابی: ابتدا اعتبارسنجی کامل و نمایش خلاصه، سپس جایگزینی یک‌جا
 * - پاک‌سازی: فقط با تأیید قوی و ورود عبارت «پاک کن»
 */
export function DataSettingsPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importPreview, setImportPreview] = useState<{
    summary: BackupSummary;
    file: BackupFile;
  } | null>(null);
  const [importError, setImportError] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const doExport = () => {
    const name = downloadBackup();
    showToast({
      variant: "success",
      title: "نسخهٔ پشتیبان آماده شد",
      description: `فایل ${name} دانلود شد.`,
    });
  };

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    setImportError("");
    try {
      const text = await f.text();
      const validation = parseBackupText(text);
      if (!validation.ok) {
        setImportError(validation.error);
        return;
      }
      setImportPreview({ summary: validation.summary, file: validation.file });
    } catch {
      setImportError("خواندن فایل ممکن نشد.");
    }
  };

  const doRestore = () => {
    if (!importPreview) return;
    restoreBackup(importPreview.file); // ریلود می‌کند
  };

  const doClear = () => {
    clearAllData(); // ریلود می‌کند
  };

  const doDemo = () => {
    restoreDemoData(); // ریلود می‌کند
  };

  return (
    <SettingsLayout title="پشتیبان‌گیری و داده‌ها" subtitle="خروجی، بازیابی و پاک‌سازی">
      <div className="settings-form">
        <section className="card settings-card" aria-label="خروجی پشتیبان">
          <h2 className="settings-card__title">
            <Download size={18} aria-hidden /> خروجی گرفتن از اطلاعات
          </h2>
          <p className="settings-caption">
            همهٔ اطلاعات — طرف حساب‌ها، فاکتورها، انبار، چک‌ها، هزینه‌ها و
            تنظیمات — در یک فایل JSON روی دستگاه شما ذخیره می‌شود.
          </p>
          <Button onClick={doExport}>
            <Download size={18} aria-hidden /> دانلود نسخهٔ پشتیبان
          </Button>
        </section>

        <section className="card settings-card" aria-label="بازیابی پشتیبان">
          <h2 className="settings-card__title">
            <Upload size={18} aria-hidden /> بازیابی اطلاعات
          </h2>
          <p className="settings-caption">
            قبل از جایگزینی، فایل به‌طور کامل اعتبارسنجی و خلاصهٔ آن نمایش
            داده می‌شود؛ با فایل نامعتبر هیچ داده‌ای تغییر نمی‌کند.
          </p>
          {importError && (
            <Alert variant="error" title="فایل نامعتبر است" description={importError} />
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="visually-hidden-input"
            onChange={(e) => {
              void handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} aria-hidden /> انتخاب فایل پشتیبان
          </Button>
        </section>

        <section className="card settings-card settings-card--danger" aria-label="منطقه خطر">
          <h2 className="settings-card__title">
            <Trash2 size={18} aria-hidden /> منطقهٔ خطر
          </h2>
          <Alert
            variant="warning"
            title="این عملیات قابل بازگشت نیست"
            description="این عملیات قابل بازگشت نیست مگر اینکه قبلاً نسخه پشتیبان گرفته باشید."
          />
          <div className="settings-danger-actions">
            <div className="list-item">
              <span className="list-item__body">
                <span className="list-item__title">
                  <RefreshCcw size={16} aria-hidden /> بازگردانی داده نمونه
                </span>
                <span className="list-item__caption">
                  دادهٔ نمونهٔ منسجم فازهای ۱ تا ۶ جایگزین داده‌های فعلی می‌شود
                </span>
              </span>
              <span className="list-item__end">
                <Button variant="secondary" onClick={() => setDemoOpen(true)}>
                  بازگردانی
                </Button>
              </span>
            </div>
            <div className="list-item">
              <span className="list-item__body">
                <span className="list-item__title">
                  <Database size={16} aria-hidden /> پاک‌سازی همهٔ اطلاعات
                </span>
                <span className="list-item__caption">
                  همهٔ داده‌های کسب‌وکار حذف می‌شوند؛ تنظیمات برنامه حفظ می‌شود
                </span>
              </span>
              <span className="list-item__end">
                <Button variant="destructive" onClick={() => setClearOpen(true)}>
                  پاک‌سازی
                </Button>
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* پیش‌نمایش و تأیید بازیابی */}
      <Modal
        open={!!importPreview}
        onClose={() => setImportPreview(null)}
        title="بازیابی نسخهٔ پشتیبان"
        description="اطلاعات فعلی با محتوای این فایل جایگزین می‌شود."
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setImportPreview(null)}>
              انصراف
            </Button>
            <Button onClick={doRestore}>بازیابی و جایگزینی</Button>
          </div>
        }
      >
        {importPreview && (
          <div className="backup-summary">
            <p>
              نسخهٔ پشتیبان: <strong>{faNum(importPreview.summary.version)}</strong>
              {importPreview.summary.appVersion && (
                <> · ساخته‌شده با نسق {toFaDigits(importPreview.summary.appVersion)}</>
              )}
            </p>
            {importPreview.summary.exportedAt && (
              <p>
                تاریخ خروجی:{" "}
                <strong>{faDateLong(importPreview.summary.exportedAt.slice(0, 10))}</strong>
              </p>
            )}
            <ul>
              {importPreview.summary.counts.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>{faNum(row.count)}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {/* تأیید بازگردانی داده نمونه */}
      <Modal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="بازگردانی داده نمونه"
        description="داده‌های فعلی حذف و دادهٔ نمونهٔ منسجم نسق جایگزین می‌شود. این عملیات قابل بازگشت نیست مگر اینکه نسخهٔ پشتیبان داشته باشید."
        footer={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDemoOpen(false)}>
              انصراف
            </Button>
            <Button variant="destructive" onClick={doDemo}>
              بازگردانی داده نمونه
            </Button>
          </div>
        }
      >
        <Alert
          variant="warning"
          title="بهتر است اول پشتیبان بگیرید"
          description="اگر از داده‌های فعلی استفاده می‌کنید، قبل از ادامه خروجی بگیرید."
        />
      </Modal>

      {/* تأیید قوی پاک‌سازی */}
      <Modal
        open={clearOpen}
        onClose={() => {
          setClearOpen(false);
          setConfirmText("");
        }}
        title="پاک‌سازی همهٔ اطلاعات"
        description="همهٔ طرف حساب‌ها، فاکتورها، کالاها، چک‌ها و هزینه‌ها برای همیشه حذف می‌شوند. این عملیات قابل بازگشت نیست مگر اینکه قبلاً نسخه پشتیبان گرفته باشید."
        footer={
          <div className="modal-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setClearOpen(false);
                setConfirmText("");
              }}
            >
              انصراف
            </Button>
            <Button variant="destructive" onClick={doClear} disabled={confirmText.trim() !== "پاک کن"}>
              پاک‌سازی کامل
            </Button>
          </div>
        }
      >
        <Field label="برای تأیید، عبارت «پاک کن» را تایپ کنید" htmlFor="clear-confirm">
          <Input
            id="clear-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="پاک کن"
          />
        </Field>
      </Modal>
    </SettingsLayout>
  );
}

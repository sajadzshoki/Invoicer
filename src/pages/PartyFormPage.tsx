import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BookUser, UserPlus } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  DatePickerTrigger,
  Field,
  Input,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { ErrorState } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { useBookStore } from "@/book/store";
import { ContactsSheet } from "@/components/party/ContactsSheet";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { isValidIranianPhone, normalizePhone } from "@/lib/phone";
import { faDateLong } from "@/lib/jalali";
import type { DeviceContact } from "@/book/types";

interface FormErrors {
  name?: string;
  phone?: string;
}

/**
 * فرم افزودن/ویرایش طرف حساب
 * مسیر: /bookAccount/add-customer (و با ?id=:id برای ویرایش)
 */
export function PartyFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { persons, addParty, updateParty } = useBookStore();

  const editId = searchParams.get("id") ?? undefined;
  const editingParty = useMemo(
    () => (editId ? persons.find((p) => p.id === editId) : undefined),
    [editId, persons]
  );
  const isEdit = !!editId;

  const importedContact = (location.state as { imported?: DeviceContact } | null)
    ?.imported;

  const [name, setName] = useState(editingParty?.name ?? importedContact?.name ?? "");
  const [phone, setPhone] = useState(
    editingParty?.phone ?? importedContact?.phone ?? ""
  );
  const [address, setAddress] = useState(editingParty?.address ?? "");
  const [birthDate, setBirthDate] = useState<string | undefined>(
    editingParty?.birthDate
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [birthSheetOpen, setBirthSheetOpen] = useState(false);

  const nameId = useFieldId();
  const phoneId = useFieldId();
  const addressId = useFieldId();

  // در حالت ویرایش، اگر طرف حساب حذف شده باشد
  const notFound = isEdit && !editingParty;

  // ورود با «?import=contacts» → باز شدن برگهٔ مخاطبین
  useEffect(() => {
    if (searchParams.get("import") === "contacts" && !isEdit) {
      setContactsOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isEdit]);

  if (notFound) {
    return (
      <>
        <PageHeader title="ویرایش طرف حساب" onBack />
        <div className="page">
          <ErrorState
            title="طرف حساب پیدا نشد"
            description="ممکن است این طرف حساب حذف شده باشد."
            action={
              <Button onClick={() => navigate("/bookAccount")}>
                بازگشت به فهرست
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmed = name.trim();
    if (!trimmed) {
      next.name = "نام را وارد کنید.";
    } else if (trimmed.length < 2) {
      next.name = "نام باید حداقل ۲ حرف باشد.";
    }
    if (phone.trim() && !isValidIranianPhone(phone)) {
      next.phone = "شمارهٔ تماس معتبر نیست؛ مثل ۰۹۱۲۳۴۵۶۷۸۹";
    }
    return next;
  };

  const submit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      showToast({
        variant: "error",
        title: "فرم کامل نیست",
        description: "خطاهای مشخص‌شده را برطرف کنید.",
      });
      return;
    }

    setSubmitting(true);
    const input = {
      name,
      phone: normalizePhone(phone) || undefined,
      address: address.trim() || undefined,
      birthDate,
    };

    // شبیه‌سازی کوتاهِ ذخیره‌سازی
    window.setTimeout(() => {
      if (isEdit && editingParty) {
        updateParty(editingParty.id, input);
        showToast({
          variant: "success",
          title: "تغییرات ذخیره شد",
          description: `اطلاعات «${name.trim()}» به‌روزرسانی شد.`,
        });
        navigate(`/bookAccount/${editingParty.id}`);
      } else {
        const person = addParty(input);
        showToast({
          variant: "success",
          title: "طرف حساب اضافه شد",
          description: `«${name.trim()}» به فهرست طرف حساب‌ها اضافه شد.`,
        });
        navigate(`/bookAccount/${person.id}`);
      }
    }, 600);
  };

  const cancel = () => {
    if (isEdit && editingParty) navigate(`/bookAccount/${editingParty.id}`);
    else navigate("/bookAccount");
  };

  return (
    <>
      <PageHeader
        title={isEdit ? "ویرایش طرف حساب" : "افزودن طرف حساب"}
        subtitle={isEdit ? editingParty?.name : "اطلاعات مشتری یا تأمین‌کننده"}
        onBack
        actions={
          !isEdit ? (
            <Button
              variant="ghost"
              size="sm"
              icon={<BookUser size={18} aria-hidden />}
              onClick={() => setContactsOpen(true)}
            >
              افزودن از مخاطبین
            </Button>
          ) : undefined
        }
      />

      <div className="page form-page">
        {importedContact && !isEdit && (
          <div className="alert alert--success mb-4" role="status">
            <div className="alert__body">
              <p className="alert__title">اطلاعات مخاطب در فرم قرار گرفت</p>
              <p className="alert__desc">
                نام و شمارهٔ «{importedContact.name}» را می‌توانید ویرایش کنید.
              </p>
            </div>
          </div>
        )}

        <div className="card form-card">
          <div className="stack" style={{ gap: "var(--space-5)" }}>
            <Field label="نام" htmlFor={nameId} error={errors.name}>
              <Input
                id={nameId}
                value={name}
                invalid={!!errors.name}
                placeholder="مثلاً علی محمدی یا شرکت پخش آریا"
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((er) => ({ ...er, name: undefined }));
                }}
                onBlur={() => {
                  if (name.trim() === "") {
                    setErrors((er) => ({ ...er, name: "نام را وارد کنید." }));
                  }
                }}
              />
            </Field>

            <Field
              label="شمارهٔ تماس"
              htmlFor={phoneId}
              optional
              error={errors.phone}
              hint={!errors.phone ? "برای تماس سریع و جست‌وجوی آسان‌تر" : undefined}
            >
              <Input
                id={phoneId}
                value={phone}
                invalid={!!errors.phone}
                placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                inputMode="tel"
                dir="ltr"
                style={{ textAlign: "end" }}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
                }}
              />
            </Field>

            <Field label="آدرس" htmlFor={addressId} optional>
              <Textarea
                id={addressId}
                rows={2}
                value={address}
                placeholder="آدرس فروشگاه یا محل طرف حساب"
                onChange={(e) => setAddress(e.target.value)}
              />
            </Field>

            <Field label="تاریخ تولد" optional>
              <DatePickerTrigger
                value={birthDate ? faDateLong(birthDate) : undefined}
                placeholder="انتخاب تاریخ تولد"
                onChange={() => setBirthSheetOpen(true)}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* نوار اقدام چسبان */}
      <div className="sticky-footer">
        <div className="sticky-footer__inner">
          <Button block size="lg" loading={submitting} icon={<UserPlus size={20} aria-hidden />} onClick={submit}>
            {isEdit ? "ذخیرهٔ تغییرات" : "افزودن طرف حساب"}
          </Button>
          <Button block variant="ghost" onClick={cancel} disabled={submitting}>
            {isEdit ? "بازگشت به حساب" : "بازگشت"}
          </Button>
        </div>
      </div>

      <ContactsSheet
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
        onPick={(contact) => {
          setName(contact.name);
          setPhone(contact.phone);
          setErrors({});
          showToast({
            variant: "info",
            title: "اطلاعات مخاطب در فرم قرار گرفت",
          });
        }}
      />

      <DateSelectSheet
        open={birthSheetOpen}
        onClose={() => setBirthSheetOpen(false)}
        title="تاریخ تولد"
        value={birthDate}
        maxDaysFromToday={0}
        onSelect={setBirthDate}
      />
    </>
  );
}

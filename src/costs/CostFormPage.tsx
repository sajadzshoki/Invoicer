import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, FolderCog, Tags } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { ListItem } from "@/components/ui/Card";
import {
  AmountInput,
  DatePickerTrigger,
  Field,
  Input,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { BottomSheet } from "@/components/ui/Overlay";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { AttachmentPicker } from "@/components/common/AttachmentPicker";
import { CostCategoriesSheet } from "@/components/cost/CostCategoriesSheet";
import { useCostStore } from "@/costs/store";
import type { CostAttachment, RegisterCostType } from "@/costs/types";
import { formatAmountInput, parseAmountDigits } from "@/lib/fa";
import { faDateLong, todayIso } from "@/lib/jalali";
import { cn } from "@/lib/cn";

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface CostFormErrors {
  title?: string;
  categoryId?: string;
  amount?: string;
  date?: string;
  time?: string;
}

/** فرم ثبت/ویرایش هزینه و درآمد */
export function CostFormPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useCostStore();
  /* ویرایش با کوئری‌پارامتر ?id= انجام می‌شود */
  const editId = searchParams.get("id") ?? undefined;
  const isEdit = !!editId;
  const editing = editId ? store.getCost(editId) : undefined;

  const initialType = useMemo<RegisterCostType>(() => {
    const fromQuery = searchParams.get("type");
    if (fromQuery === "INCOME" || fromQuery === "EXPENSE") return fromQuery;
    return editing?.type ?? "EXPENSE";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [type, setType] = useState<RegisterCostType>(initialType);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? "");
  const [amount, setAmount] = useState(
    editing ? formatAmountInput(String(editing.amount)) : ""
  );
  const [date, setDate] = useState(editing?.date ?? todayIso());
  const [time, setTime] = useState(editing?.time ?? nowTime());
  const [description, setDescription] = useState(editing?.description ?? "");
  const [attachment, setAttachment] = useState<CostAttachment | undefined>(
    editing?.attachment
  );
  const [errors, setErrors] = useState<CostFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [manageCatsOpen, setManageCatsOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);

  const titleId = useFieldId();
  const amountId = useFieldId();

  const kindCategories = useMemo(
    () => store.categories.filter((c) => c.kind === type),
    [store.categories, type]
  );
  const pickedCategory = store.getCategory(categoryId);

  /* با تغییر نوع، دستهٔ ناسازگار پاک می‌شود */
  const changeType = (next: RegisterCostType) => {
    setType(next);
    if (categoryId && store.getCategory(categoryId)?.kind !== next) {
      setCategoryId("");
    }
  };

  const validate = (): CostFormErrors => {
    const next: CostFormErrors = {};
    if (!title.trim()) next.title = "عنوان را بنویسید.";
    if (!categoryId) next.categoryId = "دسته را انتخاب کنید.";
    const amountValue = Number(parseAmountDigits(amount) || "0");
    if (!amountValue || amountValue <= 0) next.amount = "مبلغ باید بیشتر از صفر باشد.";
    if (!date) next.date = "تاریخ را انتخاب کنید.";
    if (!/^\d{2}:\d{2}$/.test(time)) next.time = "ساعت را کامل وارد کنید.";
    return next;
  };

  const submit = () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const input = {
      type,
      title,
      categoryId,
      amount: Number(parseAmountDigits(amount)),
      date,
      time,
      description,
      attachment,
    };

    window.setTimeout(() => {
      const saved = isEdit && editing
        ? store.updateCost(editing.id, input)
        : store.addCost(input);
      setSubmitting(false);
      if (!saved) return;
      navigate(isEdit ? `/costs/${saved.id}` : "/costs", { replace: isEdit });
    }, 400);
  };

  /* دسترسی مستقیم با شناسهٔ نامعتبر */
  useEffect(() => {
    if (isEdit && !editing) navigate("/costs", { replace: true });
  }, [isEdit, editing, navigate]);

  return (
    <>
      <PageHeader
        title={isEdit ? "ویرایش رکورد" : "ثبت هزینه یا درآمد"}
        subtitle={
          isEdit
            ? "ویرایش اطلاعات رکورد ثبت‌شده"
            : "هزینه‌ها و درآمدهای عمومی؛ جدا از فاکتور و چک"
        }
        onBack
      />

      <div className="page form-page">
        <div className="card form-card">
          <div className="stack" style={{ gap: "var(--space-5)" }}>
            {/* نوع */}
            <Field label="نوع رکورد">
              <SegmentedControl
                ariaLabel="نوع رکورد"
                block
                items={[
                  { id: "EXPENSE", label: "هزینه" },
                  { id: "INCOME", label: "درآمد" },
                ]}
                active={type}
                onChange={(v) => changeType(v as RegisterCostType)}
              />
            </Field>

            {/* عنوان */}
            <Field label="عنوان" htmlFor={titleId} error={errors.title}>
              <Input
                id={titleId}
                value={title}
                invalid={!!errors.title}
                placeholder={type === "EXPENSE" ? "مثل اجارهٔ مغازه" : "مثل فروش خدمات نصب"}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((er) => ({ ...er, title: undefined }));
                }}
              />
            </Field>

            {/* دسته */}
            <Field
              label="دسته‌بندی"
              error={errors.categoryId}
              hint="دسته‌های هزینه و درآمد جدا از دسته‌های کالا/خدمت مدیریت می‌شوند."
            >
              <div className="picker-row">
                <button
                  type="button"
                  className={cn("picker-trigger", errors.categoryId && "is-error")}
                  onClick={() => setCatSheetOpen(true)}
                >
                  {pickedCategory ? (
                    <>
                      <Tags size={16} aria-hidden />
                      {pickedCategory.name}
                    </>
                  ) : (
                    <span className="picker-trigger__placeholder">انتخاب دسته</span>
                  )}
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FolderCog size={16} aria-hidden />}
                  onClick={() => setManageCatsOpen(true)}
                >
                  مدیریت دسته‌ها
                </Button>
              </div>
            </Field>

            {/* مبلغ */}
            <Field label="مبلغ" htmlFor={amountId} error={errors.amount}>
              <AmountInput
                id={amountId}
                value={amount}
                invalid={!!errors.amount}
                onValueChange={(v) => {
                  setAmount(v);
                  setErrors((er) => ({ ...er, amount: undefined }));
                }}
              />
            </Field>

            {/* تاریخ و ساعت */}
            <div className="grid-2">
              <Field label="تاریخ" error={errors.date}>
                <DatePickerTrigger
                  value={date ? faDateLong(date) : undefined}
                  placeholder="انتخاب تاریخ"
                  onChange={() => setDateSheetOpen(true)}
                />
              </Field>
              <Field label="ساعت" error={errors.time}>
                <Input
                  type="time"
                  dir="ltr"
                  value={time}
                  invalid={!!errors.time}
                  aria-label="ساعت ثبت"
                  onChange={(e) => {
                    setTime(e.target.value);
                    setErrors((er) => ({ ...er, time: undefined }));
                  }}
                />
              </Field>
            </div>

            {/* توضیحات */}
            <Field label="توضیحات (اختیاری)">
              <Textarea
                value={description}
                placeholder="جزئیات بیشتر…"
                rows={3}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            {/* پیوست */}
            <Field
              label="پیوست (اختیاری)"
              hint="پیوست فقط روی همین دستگاه ذخیره می‌شود و به سروری ارسال نمی‌شود."
            >
              <AttachmentPicker value={attachment} onChange={setAttachment} />
            </Field>
          </div>
        </div>

        <div className="sticky-footer">
          <Button
            block
            icon={<Check size={18} aria-hidden />}
            loading={submitting}
            onClick={submit}
          >
            {isEdit ? "ذخیرهٔ تغییرات" : type === "EXPENSE" ? "ثبت هزینه" : "ثبت درآمد"}
          </Button>
          <Button variant="ghost" block onClick={() => navigate(-1)}>
            انصراف
          </Button>
        </div>
      </div>

      {/* برگهٔ انتخاب دسته */}
      <BottomSheet
        open={catSheetOpen}
        onClose={() => setCatSheetOpen(false)}
        title={type === "EXPENSE" ? "انتخاب دستهٔ هزینه" : "انتخاب دستهٔ درآمد"}
      >
        <div className="list">
          {kindCategories.length === 0 && (
            <p className="text-center text-muted text-sm" style={{ padding: "16px 0" }}>
              هنوز دسته‌ای برای این نوع ساخته نشده؛ از «مدیریت دسته‌ها» استفاده کنید.
            </p>
          )}
          {kindCategories.map((cat) => (
            <ListItem
              key={cat.id}
              icon={<Tags size={18} aria-hidden />}
              title={cat.name}
              className={cn(categoryId === cat.id && "is-picked")}
              onClick={() => {
                setCategoryId(cat.id);
                setErrors((er) => ({ ...er, categoryId: undefined }));
                setCatSheetOpen(false);
              }}
            />
          ))}
        </div>
        <div className="sticky-footer">
          <Button
            variant="secondary"
            block
            icon={<FolderCog size={16} aria-hidden />}
            onClick={() => {
              setCatSheetOpen(false);
              setManageCatsOpen(true);
            }}
          >
            مدیریت دسته‌ها
          </Button>
        </div>
      </BottomSheet>

      {/* مدیریت دسته‌ها */}
      <CostCategoriesSheet
        open={manageCatsOpen}
        onClose={() => setManageCatsOpen(false)}
        onPicked={(id) => {
          const cat = store.getCategory(id);
          if (cat) {
            setType(cat.kind);
            setCategoryId(id);
            setErrors((er) => ({ ...er, categoryId: undefined }));
          }
        }}
      />

      {/* انتخاب تاریخ */}
      <DateSelectSheet
        open={dateSheetOpen}
        onClose={() => setDateSheetOpen(false)}
        title="تاریخ"
        value={date || todayIso()}
        onSelect={(iso) => {
          setDate(iso);
          setErrors((er) => ({ ...er, date: undefined }));
          setDateSheetOpen(false);
        }}
      />
    </>
  );
}

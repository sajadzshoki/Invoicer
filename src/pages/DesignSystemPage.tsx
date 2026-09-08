import { useState, type ReactNode } from "react";
import {
  Check,
  Clock,
  Download,
  Heart,
  Inbox,
  Lock,
  Plus,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import {
  AmountInput,
  DatePickerTrigger,
  Field,
  Input,
  SearchInput,
  Select,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { Checkbox, Radio, Switch } from "@/components/ui/Choice";
import { SegmentedControl, Tabs } from "@/components/ui/Tabs";
import {
  Avatar,
  Badge,
  Card,
  CardHeader,
  Divider,
  DividerLabel,
  ListItem,
  StatusBadge,
} from "@/components/ui/Card";
import { BottomSheet, Drawer, Modal, Tooltip } from "@/components/ui/Overlay";
import {
  Alert,
  DismissibleAlert,
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
  SkeletonListItem,
} from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { faNum } from "@/lib/fa";

/* ------------------------------------------------------------------ */
/* این صفحه مرجع زندهٔ سیستم طراحی نسق است تا همهٔ کامپوننت‌ها و      */
/* حالت‌های تعاملی آن‌ها در هر دو تم قابل بررسی باشند.                 */
/* ------------------------------------------------------------------ */

export function DesignSystemPage() {
  return (
    <>
      <PageHeader title="سیستم طراحی" subtitle="مرجع کامپوننت‌ها و حالت‌ها" onBack />

      <div className="page">
        <SectionColors />
        <SectionTypography />
        <SectionButtons />
        <SectionFormControls />
        <SectionNavControls />
        <SectionSurfaces />
        <SectionFeedback />
        <SectionOverlays />
      </div>
    </>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="ds-section" aria-label={title}>
      <h2>{title}</h2>
      {note && <p className="ds-note">{note}</p>}
      <div className="ds-panel">{children}</div>
    </section>
  );
}

/* ------------------------------ رنگ‌ها ------------------------------ */

const SWATCHES: Array<{ name: string; token: string; cssVar: string }> = [
  { name: "برند", token: "primary", cssVar: "--color-primary" },
  { name: "برند (نرم)", token: "primary-soft", cssVar: "--color-primary-soft" },
  { name: "موفقیت", token: "success", cssVar: "--color-success" },
  { name: "هشدار", token: "warning", cssVar: "--color-warning-strong" },
  { name: "خطا", token: "error", cssVar: "--color-error" },
  { name: "اطلاع", token: "info", cssVar: "--color-info" },
  { name: "زمینه", token: "bg", cssVar: "--color-bg" },
  { name: "سطح", token: "surface", cssVar: "--color-surface" },
  { name: "سطح ۲", token: "surface-2", cssVar: "--color-surface-2" },
  { name: "خط", token: "border", cssVar: "--color-border" },
  { name: "متن اصلی", token: "text-1", cssVar: "--color-text-1" },
  { name: "متن ثانویه", token: "text-2", cssVar: "--color-text-2" },
];

function SectionColors() {
  return (
    <Section title="رنگ‌ها" note="پالت محدود و هدفمند؛ رنگ‌های مالی (درآمد، هزینه، طلب، بدهی) از توکن‌های معنایی مشتق می‌شوند.">
      <div className="ds-swatches">
        {SWATCHES.map((s) => (
          <div key={s.token} className="ds-swatch">
            <div
              className="ds-swatch__chip"
              style={{ background: `var(${s.cssVar})` }}
            />
            <div className="ds-swatch__meta">
              <span>{s.name}</span>
              <code>{`var(${s.cssVar})`}</code>
            </div>
          </div>
        ))}
      </div>
      <div className="ds-row mt-4">
        <StatusBadge tone="success" icon={<Check size={13} aria-hidden />}>پرداخت‌شده</StatusBadge>
        <StatusBadge tone="warning" icon={<Clock size={13} aria-hidden />}>در انتظار</StatusBadge>
        <StatusBadge tone="info">طلب</StatusBadge>
        <StatusBadge tone="warning">بدهی</StatusBadge>
        <StatusBadge tone="error">سررسیدشده</StatusBadge>
      </div>
    </Section>
  );
}

/* ------------------------------ تایپوگرافی ------------------------------ */

function SectionTypography() {
  return (
    <Section title="تایپوگرافی" note="فونت وزیرمتن، سلسله‌مراتب روشن، ارقام فارسی و جداکنندهٔ هزارگان.">
      <div className="ds-type-row">
        <span className="ds-type-name">نمایشی / ۲۸</span>
        <span style={{ fontSize: "var(--text-3xl)", fontWeight: 800, lineHeight: "var(--leading-tight)" }}>
          حسابداری شفاف، تصمیم آسان
        </span>
      </div>
      <div className="ds-type-row">
        <span className="ds-type-name">عنوان بزرگ / ۲۲</span>
        <span style={{ fontSize: "var(--text-2xl)", fontWeight: 700 }}>گزارش فروش این ماه</span>
      </div>
      <div className="ds-type-row">
        <span className="ds-type-name">عنوان / ۱۸</span>
        <span style={{ fontSize: "var(--text-xl)", fontWeight: 700 }}>طرف حساب‌های فعال</span>
      </div>
      <div className="ds-type-row">
        <span className="ds-type-name">بدنه / ۱۵</span>
        <span style={{ fontSize: "var(--text-base)" }}>
          فاکتورها، دریافت‌ها و پرداخت‌ها در یک نگاه؛ بدون پیچیدگی‌های غیرضروری.
        </span>
      </div>
      <div className="ds-type-row">
        <span className="ds-type-name">متن کوچک / ۱۳</span>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
          آخرین به‌روزرسانی: امروز، ساعت {faNum(14)}:{faNum(30)}
        </span>
      </div>
      <div className="ds-type-row">
        <span className="ds-type-name">مبلغ</span>
        <span style={{ fontSize: "var(--text-2xl)", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
          {faNum(124_580_000)}{" "}
          <span style={{ fontSize: "var(--text-md)", fontWeight: 500, color: "var(--color-text-3)" }}>
            تومان
          </span>
        </span>
      </div>
    </Section>
  );
}

/* ------------------------------ دکمه‌ها ------------------------------ */

function SectionButtons() {
  const [loading, setLoading] = useState(false);

  const runLoading = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1800);
  };

  return (
    <Section title="دکمه‌ها" note="پنج واریانت، سه اندازه، حالت‌های غیرفعال و بارگذاری.">
      <p className="ds-label">واریانت‌ها</p>
      <div className="ds-row">
        <Button>دکمهٔ اصلی</Button>
        <Button variant="secondary">ثانویه</Button>
        <Button variant="ghost">شبحی</Button>
        <Button variant="destructive">حذف</Button>
        <Button variant="text">دکمهٔ متنی</Button>
      </div>

      <div className="mt-4">
        <p className="ds-label">با آیکون و اندازه‌ها</p>
        <div className="ds-row">
          <Button size="sm" icon={<Plus size={16} aria-hidden />}>کوچک</Button>
          <Button icon={<Plus size={18} aria-hidden />}>متوسط</Button>
          <Button size="lg" icon={<Download size={20} aria-hidden />}>بزرگ</Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="ds-label">حالت‌ها</p>
        <div className="ds-row">
          <Button loading={loading} onClick={runLoading}>
            {loading ? "در حال ذخیره…" : "ذخیره (بارگذاری)"}
          </Button>
          <Button disabled>غیرفعال</Button>
          <Button variant="secondary" disabled>غیرفعال</Button>
          <Button variant="destructive" icon={<Trash2 size={18} aria-hidden />} disabled>
            حذف
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="ds-label">دکمه‌های آیکونی و تولتیپ</p>
        <div className="ds-row">
          <Tooltip label="افزودن">
            <IconButton label="افزودن"><Plus size={20} aria-hidden /></IconButton>
          </Tooltip>
          <Tooltip label="ویرایش">
            <IconButton label="ویرایش" tone="filled"><Trash2 size={20} aria-hidden /></IconButton>
          </Tooltip>
          <Tooltip label="علاقه‌مندی">
            <IconButton label="علاقه‌مندی" tone="tint"><Heart size={20} aria-hidden /></IconButton>
          </Tooltip>
          <Tooltip label="قفل‌شده">
            <IconButton label="قفل‌شده" disabled><Lock size={20} aria-hidden /></IconButton>
          </Tooltip>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ فرم‌ها ------------------------------ */

function SectionFormControls() {
  const nameId = useFieldId();
  const phoneId = useFieldId();
  const catId = useFieldId();
  const dateId = useFieldId();
  const amountId = useFieldId();
  const descId = useFieldId();

  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState(faNum(2_500_000));
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [sw, setSw] = useState(true);
  const [radio, setRadio] = useState("goods");

  return (
    <Section title="فرم‌ها" note="ارتفاع کنترل‌ها ۴۸ پیکسل است تا برای لمس یک‌دستی راحت باشد.">
      <div className="grid-2">
        <Field label="نام و نام خانوادگی" htmlFor={nameId} hint="نامی که در فاکتورها چاپ می‌شود.">
          <Input id={nameId} placeholder="مثلاً مریم رضایی" />
        </Field>
        <Field label="شماره تماس" htmlFor={phoneId} error="شمارهٔ تماس معتبر نیست.">
          <Input id={phoneId} value="۰۹۱۲۱۲۳" invalid readOnly onChange={() => {}} />
        </Field>
        <Field label="دسته‌بندی" htmlFor={catId}>
          <Select id={catId} defaultValue="customer">
            <option value="customer">مشتری</option>
            <option value="supplier">تأمین‌کننده</option>
            <option value="partner">همکار</option>
          </Select>
        </Field>
        <Field label="تاریخ سررسید" htmlFor={dateId} optional>
          <DatePickerTrigger id={dateId} value="۱۸ شهریور ۱۴۰۵" />
        </Field>
        <Field label="مبلغ" htmlFor={amountId} hint="فقط ارقام؛ جداکنندهٔ هزارگان خودکار اعمال می‌شود.">
          <AmountInput id={amountId} value={amount} onValueChange={setAmount} />
        </Field>
        <Field label="جست‌وجو">
          <SearchInput value={search} onValueChange={setSearch} placeholder="جست‌وجو کنید…" aria-label="جست‌وجو" />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="توضیحات فاکتور" htmlFor={descId} optional>
          <Textarea id={descId} placeholder="توضیحات اختیاری برای خریدار…" rows={3} />
        </Field>
      </div>

      <div className="mt-4">
        <p className="ds-label">حالت‌های ورودی</p>
        <div className="grid-2">
          <Input placeholder="غیرفعال" disabled aria-label="ورودی غیرفعال" />
          <Input placeholder="پر" value="۱۲٬۵۰۰٬۰۰۰" readOnly onChange={() => {}} aria-label="ورودی با مقدار" />
        </div>
      </div>

      <div className="mt-4 grid-2">
        <div>
          <p className="ds-label">چک‌باکس</p>
          <div className="ds-col">
            <Checkbox
              label="برایم ایمیل ارسال شود"
              checked={check1}
              onChange={(e) => setCheck1(e.target.checked)}
            />
            <Checkbox
              label="تخفیف روی فاکتور اعمال شود"
              desc="پس از تأیید مدیر قابل تغییر نیست."
              checked={check2}
              onChange={(e) => setCheck2(e.target.checked)}
            />
            <Checkbox label="غیرفعال" disabled />
          </div>
        </div>
        <div>
          <p className="ds-label">رادیو</p>
          <div className="ds-col" role="radiogroup" aria-label="نوع قلم">
            <Radio
              label="کالا"
              name="ds-kind"
              checked={radio === "goods"}
              onChange={() => setRadio("goods")}
            />
            <Radio
              label="خدمت"
              name="ds-kind"
              checked={radio === "services"}
              onChange={() => setRadio("services")}
            />
            <Radio label="غیرفعال" name="ds-kind" disabled />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="ds-label">سوییچ</p>
        <div className="ds-row" style={{ gap: "var(--space-8)" }}>
          <Switch label="اعلان‌ها" checked={sw} onChange={(e) => setSw(e.target.checked)} />
          <Switch label="غیرفعال" disabled />
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ ناوبری ------------------------------ */

function SectionNavControls() {
  const [tab, setTab] = useState("all");
  const [seg, setSeg] = useState("month");

  return (
    <Section title="تب‌ها و سگمنتد کنترل">
      <p className="ds-label">تب‌های زیرخطی</p>
      <Tabs
        ariaLabel="تب‌های نمونه"
        tabs={[
          { id: "all", label: "همه", count: 12 },
          { id: "sales", label: "فروش", count: 8 },
          { id: "purchases", label: "خرید", count: 4 },
          { id: "drafts", label: "پیش‌فاکتور", count: 0 },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="mt-6">
        <p className="ds-label">سگمنتد کنترل</p>
        <SegmentedControl
          ariaLabel="بازهٔ زمانی"
          items={[
            { id: "week", label: "هفته" },
            { id: "month", label: "ماه" },
            { id: "year", label: "سال" },
          ]}
          active={seg}
          onChange={setSeg}
        />
      </div>
    </Section>
  );
}

/* ------------------------------ سطوح ------------------------------ */

function SectionSurfaces() {
  return (
    <Section title="کارت، لیست، آواتار و نشان‌ها">
      <div className="grid-2">
        <Card>
          <CardHeader title="کارت ساده" subtitle="برای نمایش اطلاعات یا گروه‌بندی فرم" />
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
            گوشه‌های نرم، خط حاشیهٔ ظریف و سایهٔ ملایم در هر دو تم.
          </p>
        </Card>
        <Card interactive onClick={() => {}}>
          <CardHeader title="کارت تعاملی" subtitle="حالت هاور و فشرده دارد" />
          <StatusBadge tone="success" icon={<Check size={13} aria-hidden />}>فعال</StatusBadge>
        </Card>
      </div>

      <div className="mt-4">
        <p className="ds-label">آیتم لیست</p>
        <Card flat style={{ padding: 0, overflow: "hidden" }}>
          <div className="list">
            <ListItem
              icon={<Star size={20} aria-hidden />}
              tintIcon
              title="آیتم با آیکون و توضیح"
              caption="توضیح کوتاه در خط دوم"
              end={<Badge tone="primary">جدید</Badge>}
            />
            <ListItem
              avatar={<Avatar label="ع‌م" size="md" />}
              title="آیتم با آواتار و نشان وضعیت"
              caption="۱۸ شهریور ۱۴۰۵"
              end={<StatusBadge tone="warning" icon={<Clock size={13} aria-hidden />}>در انتظار</StatusBadge>}
              onClick={() => {}}
            />
            <ListItem
              icon={<Share2 size={20} aria-hidden />}
              title="آیتم با فلش رفتن"
              caption="در RTL فلش به سمت چپ اشاره می‌کند"
              chevron
              onClick={() => {}}
            />
          </div>
        </Card>
      </div>

      <div className="ds-row mt-4">
        <div>
          <p className="ds-label">آواتار</p>
          <div className="ds-row">
            <Avatar label="م‌ر" size="sm" />
            <Avatar label="م‌ر" size="md" />
            <Avatar label="م‌ر" size="lg" />
          </div>
        </div>
        <div>
          <p className="ds-label">نشان‌ها</p>
          <div className="ds-row">
            <Badge tone="neutral">پیش‌فرض</Badge>
            <Badge tone="primary">برند</Badge>
            <Badge tone="success">موفق</Badge>
            <Badge tone="warning">هشدار</Badge>
            <Badge tone="error">خطا</Badge>
            <Badge tone="info">اطلاع</Badge>
            <Badge tone="outline">خطی</Badge>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DividerLabel>جداکننده با برچسب</DividerLabel>
        <Divider className="mt-4" />
      </div>
    </Section>
  );
}

/* ------------------------------ بازخورد ------------------------------ */

function SectionFeedback() {
  const { showToast } = useToast();

  return (
    <Section title="بازخورد و وضعیت‌ها">
      <p className="ds-label">هشدارها</p>
      <div className="ds-col">
        <Alert variant="info" title="اطلاع" description="نسخهٔ جدید نسق به‌زودی منتشر می‌شود." />
        <Alert variant="success" title="ذخیره شد" description="تغییرات با موفقیت ذخیره شد." />
        <Alert variant="warning" title="یادآوری" description="چک شمارهٔ ۱۰۲۴ سه روز دیگر سررسید می‌شود." />
        <Alert variant="error" title="ناموفق بود" description="ثبت فاکتور انجام نشد؛ دوباره تلاش کنید." />
        <DismissibleAlert variant="info" title="هشدار قابل‌بستن" description="این هشدار را می‌توان بست." />
      </div>

      <div className="mt-6">
        <p className="ds-label">توست‌ها</p>
        <div className="ds-row">
          <Button variant="secondary" size="sm" onClick={() => showToast({ title: "فاکتور ثبت شد", description: "فاکتور شمارهٔ ۱۰۲۵ با موفقیت ثبت شد.", variant: "success" })}>
            توست موفق
          </Button>
          <Button variant="secondary" size="sm" onClick={() => showToast({ title: "خطا در اتصال", description: "اتصال اینترنت برقرار نیست.", variant: "error" })}>
            توست خطا
          </Button>
          <Button variant="secondary" size="sm" onClick={() => showToast({ title: "یادآوری چک", variant: "warning" })}>
            توست هشدار
          </Button>
          <Button variant="secondary" size="sm" onClick={() => showToast({ title: "به‌روزرسانی موجود است", variant: "info" })}>
            توست اطلاع
          </Button>
        </div>
      </div>

      <div className="grid-2 mt-6">
        <div>
          <p className="ds-label">وضعیت خالی</p>
          <Card flat style={{ borderStyle: "dashed" }}>
            <EmptyState
              compact
              icon={<Inbox size={28} aria-hidden />}
              title="هنوز تراکنشی وجود ندارد"
              description="اولین تراکنش خود را ثبت کنید."
              actions={<Button variant="secondary" size="sm">ثبت تراکنش</Button>}
            />
          </Card>
        </div>
        <div>
          <p className="ds-label">وضعیت خطا</p>
          <Card flat style={{ borderStyle: "dashed" }}>
            <ErrorState action={<Button size="sm" variant="secondary">تلاش دوباره</Button>} />
          </Card>
        </div>
      </div>

      <div className="grid-2 mt-4">
        <div>
          <p className="ds-label">بارگذاری</p>
          <Card flat style={{ borderStyle: "dashed" }}>
            <LoadingState />
          </Card>
        </div>
        <div>
          <p className="ds-label">اسکلت</p>
          <Card flat style={{ borderStyle: "dashed", paddingBlock: "var(--space-2)", paddingInline: 0 }}>
            <SkeletonListItem />
            <SkeletonListItem />
            <div style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)" }}>
              <Skeleton circle width={42} height={42} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton width="60%" />
                <Skeleton width="40%" height={11} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------ اوورلی‌ها ------------------------------ */

function SectionOverlays() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { showToast } = useToast();

  return (
    <Section title="اوورلی‌ها" note="باتم‌شیت انتخاب اصلی موبایل است؛ مودال برای تأییدها و کشو برای منوهای کناری.">
      <div className="ds-row">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>باتم‌شیت</Button>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>مودال</Button>
        <Button variant="secondary" onClick={() => setConfirmOpen(true)}>مودال تأیید حذف</Button>
        <Button variant="secondary" onClick={() => setDrawerOpen(true)}>کشو</Button>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="مرتب‌سازی">
        <div className="list">
          <ListItem title="جدیدترین" caption="بر اساس تاریخ ثبت" end={<Check size={18} aria-hidden />} onClick={() => setSheetOpen(false)} />
          <ListItem title="بیشترین مبلغ" caption="بر اساس جمع فاکتور" onClick={() => setSheetOpen(false)} />
          <ListItem title="نام طرف حساب" caption="ترتیب الفبا" onClick={() => setSheetOpen(false)} />
        </div>
        <div style={{ padding: "var(--space-3) var(--space-1)" }}>
          <Button block onClick={() => setSheetOpen(false)}>اعمال</Button>
        </div>
      </BottomSheet>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="ویرایش مشخصات"
        description="تغییرات پس از ذخیره در همهٔ فاکتورها اعمال می‌شود."
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>ذخیره</Button>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>انصراف</Button>
          </>
        }
      >
        <div className="stack">
          <Input placeholder="نام کسب‌وکار" aria-label="نام کسب‌وکار" />
          <Input placeholder="شماره تماس" aria-label="شماره تماس" />
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="حذف فاکتور؟"
        description="این عمل قابل بازگشت نیست و فاکتور شمارهٔ ۱۰۲۴ برای همیشه حذف می‌شود."
        footer={
          <>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                showToast({ title: "فاکتور حذف شد", variant: "success" });
              }}
            >
              حذف شود
            </Button>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>انصراف</Button>
          </>
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="فیلترها">
        <div className="ds-col" style={{ padding: "0 var(--space-2)" }}>
          <Checkbox label="فقط پرداخت‌شده‌ها" defaultChecked />
          <Checkbox label="فقط دارای سررسید این هفته" />
          <Checkbox label="مخفی‌کردن پیش‌فاکتورها" />
          <Divider className="mt-2" />
          <Button block onClick={() => setDrawerOpen(false)}>اعمال فیلترها</Button>
        </div>
      </Drawer>
    </Section>
  );
}

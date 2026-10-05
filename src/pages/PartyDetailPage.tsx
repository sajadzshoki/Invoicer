import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlarmClock,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  BellOff,
  Cake,
  Clock,
  FileSignature,
  FileText,
  HandCoins,
  ListFilter,
  MapPin,
  MoreVertical,
  NotebookPen,
  Pencil,
  Phone,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Avatar, Badge, ListItem } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/Tabs";
import {
  DatePickerTrigger,
  Field,
  Input,
  SearchInput,
  Textarea,
  useFieldId,
} from "@/components/ui/Field";
import { Alert, EmptyState, ErrorState } from "@/components/ui/Feedback";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { useBookStore } from "@/book/store";
import { useInvoiceStore } from "@/invoices/store";
import { useChequeStore } from "@/cheques/store";
import { computePartySummary } from "@/book/finance";
import type { BookAccountTransaction, PartyNote, PartyReminder } from "@/book/types";
import { PartyStatusBadge } from "@/components/party/PartyStatusBadge";
import { MoneyFormSheet, type MoneyKind } from "@/components/party/MoneyFormSheet";
import { DateSelectSheet } from "@/components/party/DateSelectSheet";
import { TimeSelectSheet, formatTimeFa } from "@/components/party/TimeSelectSheet";
import { currencyUnitLabel, faMoney, faNum, initialsOfName } from "@/lib/fa";
import { formatPhoneDisplay } from "@/lib/phone";
import { faDateLong, relativeFaDate, todayIso } from "@/lib/jalali";
import { cn } from "@/lib/cn";

type HistoryTab = "all" | "received" | "paid";
type DateRange = "all" | "today" | "7d" | "30d";

const RANGE_LABEL: Record<DateRange, string> = {
  all: "همهٔ زمان‌ها",
  today: "امروز",
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
};

export function PartyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const store = useBookStore();
  const invoiceStore = useInvoiceStore();
  const chequeStore = useChequeStore();
  const { persons, transactions, notes, reminders } = store;

  const person = persons.find((p) => p.id === id);

  /* ------------------------- پنل‌ها و فرم‌ها ------------------------- */
  const [money, setMoney] = useState<{ open: boolean; kind: MoneyKind }>({
    open: false,
    kind: "received",
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteSheet, setNoteSheet] = useState<{ open: boolean; editing?: PartyNote }>({
    open: false,
  });
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [deleteReminderId, setDeleteReminderId] = useState<string | null>(null);
  const [historyFilterOpen, setHistoryFilterOpen] = useState(false);

  /* ------------------------- فیلترهای تاریخچه ------------------------- */
  const [tab, setTab] = useState<HistoryTab>("all");
  const [histQuery, setHistQuery] = useState("");
  const [range, setRange] = useState<DateRange>("all");

  /* ------------------------- دادهٔ مشتق‌شده ------------------------- */
  const personTxs = useMemo(
    () =>
      transactions
        .filter((t) => t.personId === id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, id]
  );

  /* ارجاع‌های مالی طرف حساب — برای حفاظت از حذف */
  const personInvoices = useMemo(
    () => invoiceStore.invoices.filter((inv) => inv.personId === id),
    [invoiceStore.invoices, id]
  );
  const personCheques = useMemo(
    () => chequeStore.cheques.filter((c) => c.personId === id),
    [chequeStore.cheques, id]
  );
  /* طرف حساب با هر اثر مالی (تراکنش، فاکتور یا چک) حذف نمی‌شود تا هیچ
     رکوردی بی‌سرپرست نماند؛ حذف فقط برای حساب‌های بدون تاریخچه مجاز است. */
  const hasFinancialHistory =
    personTxs.length > 0 || personInvoices.length > 0 || personCheques.length > 0;
  const summary = useMemo(() => computePartySummary(personTxs), [personTxs]);
  const personNotes = useMemo(
    () =>
      notes
        .filter((n) => n.personId === id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [notes, id]
  );
  const personReminders = useMemo(
    () =>
      reminders
        .filter((r) => r.personId === id)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [reminders, id]
  );

  const historyEntries = useMemo(() => {
    const rangeLimit = (() => {
      if (range === "all") return null;
      const days = range === "today" ? 0 : range === "7d" ? 6 : 29;
      const d = new Date();
      d.setDate(d.getDate() - days);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${mm}-${dd}`;
    })();

    const q = histQuery.trim().toLowerCase();

    const txEntries = personTxs
      .filter((t) => {
        if (tab === "received" && t.type !== "RECEIVED") return false;
        if (tab === "paid" && t.type !== "PAID") return false;
        if (rangeLimit && t.date < rangeLimit) return false;
        if (q) {
          const haystack = `${t.description ?? ""} ${txTypeLabel(t.type)}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .map((t) => ({ kind: "tx" as const, tx: t, sortKey: t.date }));

    const noteEntries =
      tab === "all"
        ? personNotes
            .filter((n) => {
              if (rangeLimit && n.createdAt.slice(0, 10) < rangeLimit) return false;
              if (q && !n.text.toLowerCase().includes(q)) return false;
              return true;
            })
            .map((n) => ({ kind: "note" as const, note: n, sortKey: n.createdAt.slice(0, 10) }))
        : [];

    return [...txEntries, ...noteEntries].sort((a, b) =>
      b.sortKey.localeCompare(a.sortKey)
    );
  }, [personTxs, personNotes, tab, histQuery, range]);

  const hasHistoryFilters = tab !== "all" || histQuery.trim() !== "" || range !== "all";
  const hasAnyEntry = personTxs.length > 0 || personNotes.length > 0;

  if (!person) {
    return (
      <>
        <PageHeader title="طرف حساب" onBack />
        <div className="page">
          <ErrorState
            title="طرف حساب پیدا نشد"
            description="ممکن است این طرف حساب حذف شده باشد."
            action={<Button onClick={() => navigate("/bookAccount")}>بازگشت به فهرست</Button>}
          />
        </div>
      </>
    );
  }

  /* ------------------------- اکشن‌ها ------------------------- */
  const submitMoney = (kind: MoneyKind) => (values: { amount: number; date: string; description?: string }) => {
    store.addTransaction({
      personId: person.id,
      type: kind === "received" ? "RECEIVED" : "PAID",
      amount: values.amount,
      date: values.date,
      description: values.description,
    });
  };

  const submitNote = (text: string) => {
    if (noteSheet.editing) {
      store.updateNote(noteSheet.editing.id, text);
      showToast({ variant: "success", title: "یادداشت به‌روزرسانی شد" });
    } else {
      store.addNote(person.id, text);
      showToast({ variant: "success", title: "یادداشت ثبت شد" });
    }
    setNoteSheet({ open: false });
  };

  const doDeleteParty = () => {
    store.deleteParty(person.id);
    setDeleteOpen(false);
    showToast({
      variant: "success",
      title: "طرف حساب حذف شد",
      description: `«${person.name}» از فهرست حذف شد.`,
    });
    navigate("/bookAccount");
  };

  return (
    <>
      <PageHeader
        title={person.name}
        subtitle={person.phone ? formatPhoneDisplay(person.phone) : "بدون شمارهٔ تماس"}
        onBack
        actions={
          <>
            <IconButton label="یادآور" tone="filled" onClick={() => setReminderOpen(true)}>
              <Bell size={20} aria-hidden />
            </IconButton>
            <IconButton label="گزینه‌های بیشتر" tone="filled" onClick={() => setMenuOpen(true)}>
              <MoreVertical size={20} aria-hidden />
            </IconButton>
          </>
        }
      />

      <div className="page">
        {/* پروفایل */}
        <section aria-label="پروفایل طرف حساب">
          <div className="party-profile">
            <Avatar label={initialsOfName(person.name)} size="lg" />
            <div className="party-profile__body">
              <div className="party-profile__row">
                <h2 className="party-profile__name">{person.name}</h2>
                <PartyStatusBadge status={summary.status} />
              </div>
              {person.phone && (
                <p className="party-profile__meta">
                  <Phone size={14} aria-hidden />
                  {formatPhoneDisplay(person.phone)}
                </p>
              )}
              {person.address && (
                <p className="party-profile__meta">
                  <MapPin size={14} aria-hidden />
                  {person.address}
                </p>
              )}
              {person.birthDate && (
                <p className="party-profile__meta">
                  <Cake size={14} aria-hidden />
                  تولد: {faDateLong(person.birthDate)}
                </p>
              )}
            </div>
            <div className="party-profile__actions">
              {person.phone && (
                <a className="btn btn--secondary btn--sm" href={`tel:${person.phone}`}>
                  <Phone size={16} aria-hidden />
                  تماس
                </a>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<Pencil size={16} aria-hidden />}
                onClick={() => navigate(`/bookAccount/add-customer?id=${person.id}`)}
              >
                ویرایش
              </Button>
            </div>
          </div>
        </section>

        {/* خلاصهٔ مالی */}
        <section className="page__section" aria-label="خلاصهٔ مالی">
          <div className="balance-hero">
            <span className="balance-hero__label">ماندهٔ حساب</span>
            <p className="balance-hero__amount">
              {faMoney(Math.abs(summary.balance))}
              <span className="amount-unit">{currencyUnitLabel()}</span>
            </p>
            <div className="balance-hero__status">
              {summary.status === "settled" ? (
                <span className="balance-hero__hint">حساب تسویه است</span>
              ) : summary.status === "debtor" ? (
                <span className="balance-hero__hint">{person.name} این مبلغ را به شما بدهکار است</span>
              ) : (
                <span className="balance-hero__hint">شما این مبلغ را به {person.name} بدهکارید</span>
              )}
            </div>
          </div>

          <div className="fin-tiles">
            <FinTile label="طلب از او" value={summary.receivable} tone="info" />
            <FinTile label="بدهی به او" value={summary.payable} tone="warning" />
            <FinTile label="مجموع فروش" value={summary.totalSales} tone="success" />
            <FinTile label="مجموع خرید" value={summary.totalPurchases} tone="neutral" />
            <FinTile
              label="سود معامله"
              value={summary.profit}
              tone={summary.profit >= 0 ? "success" : "error"}
            />
          </div>
          <p className="fin-note">
            فروش و خرید از رکوردهای دفتر حساب همین طرف حساب است. فاکتور نقدی در لحظه تسویه می‌شود و روی این جمع اثر نمی‌گذارد.
          </p>
        </section>

        {/* اقدامات اصلی */}
        <section className="page__section" aria-label="اقدامات حساب">
          <div className="action-stack">
            <Button
              size="lg"
              block
              icon={<ArrowDownToLine size={20} aria-hidden />}
              onClick={() => setMoney({ open: true, kind: "received" })}
            >
              پول گرفتم
            </Button>
            <Button
              size="lg"
              block
              variant="secondary"
              icon={<ArrowUpFromLine size={20} aria-hidden />}
              onClick={() => setMoney({ open: true, kind: "paid" })}
            >
              پول دادم
            </Button>
            <Button
              size="lg"
              block
              variant="ghost"
              icon={<FileSignature size={20} aria-hidden />}
              onClick={() => navigate(`/invoices/add?partyId=${encodeURIComponent(person.id)}`)}
            >
              ثبت فاکتور
            </Button>
          </div>
        </section>

        {/* یادآورها */}
        <section className="page__section" aria-label="یادآورها">
          <div className="section-head">
            <h2>یادآورها</h2>
            <Button variant="text" size="sm" icon={<AlarmClock size={16} aria-hidden />} onClick={() => setReminderOpen(true)}>
              یادآور جدید
            </Button>
          </div>
          {personReminders.length === 0 ? (
            <div className="card card--flat remind-empty">
              <BellOff size={18} aria-hidden />
              <span>یادآوری تنظیم نشده است.</span>
            </div>
          ) : (
            <div className="more-group">
              <div className="list">
                {personReminders.map((reminder) => (
                  <ReminderRow
                    key={reminder.id}
                    reminder={reminder}
                    onDelete={() => setDeleteReminderId(reminder.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* تاریخچه حساب */}
        <section className="page__section" aria-label="تاریخچه حساب">
          <div className="section-head">
            <h2>تاریخچه حساب</h2>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant="text"
                size="sm"
                icon={<StickyNote size={16} aria-hidden />}
                onClick={() => setNoteSheet({ open: true })}
              >
                یادداشت جدید
              </Button>
              <IconButton
                label="فیلتر تاریخچه"
                size="sm"
                tone={hasHistoryFilters ? "tint" : "filled"}
                onClick={() => setHistoryFilterOpen(true)}
              >
                <ListFilter size={18} aria-hidden />
              </IconButton>
            </div>
          </div>

          <SegmentedControl
            ariaLabel="فیلتر نوع تراکنش"
            block
            className="mb-4"
            items={[
              { id: "all", label: "همه" },
              { id: "received", label: "دریافت" },
              { id: "paid", label: "پرداخت" },
            ]}
            active={tab}
            onChange={(v) => setTab(v as HistoryTab)}
          />

          {hasHistoryFilters && (
            <div className="party-controls-row mb-4">
              {histQuery.trim() && (
                <button type="button" className="control-chip" onClick={() => setHistQuery("")}>
                  «{histQuery.trim()}»
                  <Search size={12} aria-hidden />
                </button>
              )}
              {range !== "all" && (
                <button type="button" className="control-chip" onClick={() => setRange("all")}>
                  {RANGE_LABEL[range]}
                </button>
              )}
              <Button
                variant="text"
                size="sm"
                onClick={() => {
                  setTab("all");
                  setHistQuery("");
                  setRange("all");
                }}
              >
                پاک‌کردن فیلترها
              </Button>
            </div>
          )}

          {!hasAnyEntry ? (
            <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
              <EmptyState
                icon={<HandCoins size={30} aria-hidden />}
                title="هنوز تراکنشی ثبت نشده"
                description="با ثبت دریافت، پرداخت یا فاکتور، تاریخچهٔ حساب این طرف حساب ساخته می‌شود."
                actions={
                  <Button
                    icon={<ArrowDownToLine size={18} aria-hidden />}
                    onClick={() => setMoney({ open: true, kind: "received" })}
                  >
                    پول گرفتم
                  </Button>
                }
              />
            </div>
          ) : historyEntries.length === 0 ? (
            <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
              <EmptyState
                compact
                icon={<Search size={26} aria-hidden />}
                title="با این فیلترها چیزی پیدا نشد"
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setTab("all");
                      setHistQuery("");
                      setRange("all");
                    }}
                  >
                    پاک‌کردن فیلترها
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="timeline">
              {historyEntries.map((entry) =>
                entry.kind === "tx" ? (
                  <TransactionRow
                    key={entry.tx.id}
                    tx={entry.tx}
                    onOpen={
                      entry.tx.chequeId
                        ? () => navigate(`/cheque/${entry.tx.chequeId}`)
                        : entry.tx.invoiceId
                          ? () => navigate(`/invoices/invoice/${entry.tx.invoiceId}`)
                          : undefined
                    }
                  />
                ) : (
                  <NoteRow
                    key={entry.note.id}
                    note={entry.note}
                    onEdit={() => setNoteSheet({ open: true, editing: entry.note })}
                    onDelete={() => setDeleteNoteId(entry.note.id)}
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* ------------------------- پنل‌ها ------------------------- */}

      <MoneyFormSheet
        open={money.open}
        kind={money.kind}
        partyName={person.name}
        onClose={() => setMoney((m) => ({ ...m, open: false }))}
        onSubmit={submitMoney(money.kind)}
      />

      {/* منوی بیشتر */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={person.name}>
        <div className="list">
          <ListItem
            icon={<Pencil size={20} aria-hidden />}
            title="ویرایش اطلاعات"
            onClick={() => {
              setMenuOpen(false);
              navigate(`/bookAccount/add-customer?id=${person.id}`);
            }}
          />
          <ListItem
            icon={<AlarmClock size={20} aria-hidden />}
            title="تنظیم یادآور"
            onClick={() => {
              setMenuOpen(false);
              setReminderOpen(true);
            }}
          />
          <ListItem
            icon={<StickyNote size={20} aria-hidden />}
            title="یادداشت جدید"
            onClick={() => {
              setMenuOpen(false);
              setNoteSheet({ open: true });
            }}
          />
          <ListItem
            icon={<Trash2 size={20} aria-hidden />}
            title="حذف طرف حساب"
            className="danger-row"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          />
        </div>
      </BottomSheet>

      {/* فرم یادداشت */}
      <NoteSheet
        open={noteSheet.open}
        editing={noteSheet.editing}
        onClose={() => setNoteSheet({ open: false })}
        onSubmit={submitNote}
      />

      {/* فرم یادآور */}
      <ReminderSheet
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onSubmit={(input) => {
          store.addReminder({ ...input, personId: person.id });
          showToast({ variant: "success", title: "یادآور تنظیم شد", description: `«${input.title}» برای ${faDateLong(input.date)} ساعت ${formatTimeFa(input.time)}` });
        }}
      />

      {/* فیلتر تاریخچه */}
      <BottomSheet
        open={historyFilterOpen}
        onClose={() => setHistoryFilterOpen(false)}
        title="فیلتر تاریخچه"
      >
        <div className="stack">
          <SearchInput
            value={histQuery}
            onValueChange={setHistQuery}
            placeholder="جست‌وجو در توضیحات…"
            aria-label="جست‌وجو در تاریخچه"
          />
          <div>
            <p className="ds-label">بازهٔ زمانی</p>
            <div className="chip-row">
              {(Object.keys(RANGE_LABEL) as DateRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={cn("chip", range === r && "is-active")}
                  onClick={() => setRange(r)}
                >
                  {RANGE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>
          <Button
            block
            variant="secondary"
            onClick={() => {
              setTab("all");
              setHistQuery("");
              setRange("all");
            }}
          >
            پاک‌کردن فیلترها
          </Button>
        </div>
      </BottomSheet>

      {/* تأیید حذف طرف حساب */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={hasFinancialHistory ? "حذف این طرف حساب مجاز نیست" : "حذف طرف حساب؟"}
        description={
          hasFinancialHistory
            ? "این طرف حساب تاریخچهٔ مالی دارد و برای حفظ یکپارچگی حساب‌ها حذف نمی‌شود."
            : `«${person.name}» به‌طور کامل از فهرست طرف حساب‌ها حذف می‌شود. این عمل قابل بازگشت نیست.`
        }
        footer={
          hasFinancialHistory ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteOpen(false);
                  navigate(`/reports/party/${person.id}`);
                }}
              >
                مشاهدهٔ صورت‌حساب
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                بستن
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={doDeleteParty}>
                حذف طرف حساب
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                انصراف
              </Button>
            </>
          )
        }
      >
        {hasFinancialHistory && (
          <Alert
            variant="warning"
            title="حساب دارای سابقه حذف نمی‌شود"
            description={`${faNum(personTxs.length)} تراکنش، ${faNum(personInvoices.length)} فاکتور و ${faNum(personCheques.length)} چک به این طرف حساب متصل است. حذف این موارد باعث ازبین‌رفتن ردپای مالی می‌شود؛ اگر نیازی به این حساب ندارید، می‌توانید قبل از پاک‌سازی کامل از «پشتیبان‌گیری» در تنظیمات استفاده کنید.`}
          />
        )}
      </Modal>

      {/* تأیید حذف یادداشت */}
      <Modal
        open={!!deleteNoteId}
        onClose={() => setDeleteNoteId(null)}
        title="حذف یادداشت؟"
        description="این یادداشت برای همیشه حذف می‌شود و قابل بازگشت نیست."
        footer={
          <>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteNoteId) store.deleteNote(deleteNoteId);
                setDeleteNoteId(null);
                showToast({ variant: "success", title: "یادداشت حذف شد" });
              }}
            >
              حذف یادداشت
            </Button>
            <Button variant="ghost" onClick={() => setDeleteNoteId(null)}>
              انصراف
            </Button>
          </>
        }
      />

      {/* تأیید حذف یادآور */}
      <Modal
        open={!!deleteReminderId}
        onClose={() => setDeleteReminderId(null)}
        title="حذف یادآور؟"
        description="این یادآور حذف می‌شود و دیگر نمایش داده نخواهد شد."
        footer={
          <>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteReminderId) store.deleteReminder(deleteReminderId);
                setDeleteReminderId(null);
                showToast({ variant: "success", title: "یادآور حذف شد" });
              }}
            >
              حذف یادآور
            </Button>
            <Button variant="ghost" onClick={() => setDeleteReminderId(null)}>
              انصراف
            </Button>
          </>
        }
      />
    </>
  );
}

/* ============================ زیرکامپوننت‌ها ============================ */

function txTypeLabel(type: BookAccountTransaction["type"]): string {
  switch (type) {
    case "RECEIVED":
      return "پول گرفتم";
    case "PAID":
      return "پول دادم";
    case "SALE_INVOICE":
      return "فاکتور فروش";
    case "PURCHASE_INVOICE":
      return "فاکتور خرید";
    case "CHEQUE":
      return "چک";
  }
}

function FinTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "info" | "warning" | "success" | "error" | "neutral";
}) {
  return (
    <div className={`fin-tile fin-tile--${tone}`}>
      <span className="fin-tile__label">{label}</span>
      <span className="fin-tile__value">{faMoney(Math.abs(value))}</span>
      <span className="fin-tile__unit">{currencyUnitLabel()}</span>
    </div>
  );
}

function TransactionRow({
  tx,
  onOpen,
}: {
  tx: BookAccountTransaction;
  onOpen?: () => void;
}) {
  const meta = txVisual(tx.type);
  const sign = tx.type === "RECEIVED" || tx.type === "PURCHASE_INVOICE" ? "−" : "+";
  const body = (
    <>
      <span className={`t-item__icon t-item__icon--${meta.tone}`} aria-hidden>
        {meta.icon}
      </span>
      <div className="t-item__body">
        <span className="t-item__title">{txTypeLabel(tx.type)}</span>
        {tx.description && <span className="t-item__desc">{tx.description}</span>}
        <span className="t-item__date">{relativeFaDate(tx.date)}</span>
      </div>
      <div className="t-item__amount">
        <span className={`t-item__value t-item__value--${meta.tone}`}>
          {sign} {faMoney(tx.amount)}
        </span>
        <span className="t-item__unit">{currencyUnitLabel()}</span>
      </div>
    </>
  );
  if (!onOpen) return <div className="t-item">{body}</div>;
  return (
    <button type="button" className="t-item t-item--link" onClick={onOpen}>
      {body}
    </button>
  );
}

function txVisual(type: BookAccountTransaction["type"]): {
  icon: React.ReactNode;
  tone: "received" | "paid" | "invoice" | "neutral";
} {
  switch (type) {
    case "RECEIVED":
      return { icon: <ArrowDownToLine size={18} />, tone: "received" };
    case "PAID":
      return { icon: <ArrowUpFromLine size={18} />, tone: "paid" };
    case "SALE_INVOICE":
    case "PURCHASE_INVOICE":
      return { icon: <FileText size={18} />, tone: "invoice" };
    case "CHEQUE":
      return { icon: <FileSignature size={18} />, tone: "neutral" };
  }
}

function NoteRow({
  note,
  onEdit,
  onDelete,
}: {
  note: PartyNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="t-item">
      <span className="t-item__icon t-item__icon--note" aria-hidden>
        <NotebookPen size={18} />
      </span>
      <div className="t-item__body">
        <span className="t-item__title">یادداشت</span>
        <span className="t-item__desc">{note.text}</span>
        <span className="t-item__date">
          {relativeFaDate(note.createdAt.slice(0, 10))}
          {note.updatedAt ? " · ویرایش‌شده" : ""}
        </span>
      </div>
      <div className="t-item__actions">
        <IconButton label="ویرایش یادداشت" size="sm" onClick={onEdit}>
          <Pencil size={16} aria-hidden />
        </IconButton>
        <IconButton label="حذف یادداشت" size="sm" onClick={onDelete}>
          <Trash2 size={16} aria-hidden />
        </IconButton>
      </div>
    </div>
  );
}

function ReminderRow({
  reminder,
  onDelete,
}: {
  reminder: PartyReminder;
  onDelete: () => void;
}) {
  const isPast = reminder.date < todayIso();
  return (
    <div className="list-item">
      <span className={cn("list-item__icon", !isPast && "list-item__icon--tint")} aria-hidden>
        <AlarmClock size={20} />
      </span>
      <span className="list-item__body">
        <span className="list-item__title">{reminder.title}</span>
        <span className="list-item__caption">
          {relativeFaDate(reminder.date, { future: true })} · ساعت {formatTimeFa(reminder.time)}
          {reminder.description ? ` — ${reminder.description}` : ""}
        </span>
      </span>
      <span className="list-item__end">
        {isPast ? (
          <Badge tone="neutral">گذشته</Badge>
        ) : (
          <Badge tone="primary">در پیش</Badge>
        )}
        <IconButton label="حذف یادآور" size="sm" onClick={onDelete}>
          <Trash2 size={16} aria-hidden />
        </IconButton>
      </span>
    </div>
  );
}

/* فرم یادداشت */
function NoteSheet({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing?: PartyNote;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState(editing?.text ?? "");
  const [error, setError] = useState<string | undefined>();
  const textId = useFieldId();

  useEffect(() => {
    if (open) {
      setText(editing?.text ?? "");
      setError(undefined);
    }
  }, [open, editing]);

  return (
    <BottomSheet open={open} onClose={onClose} title={editing ? "ویرایش یادداشت" : "یادداشت جدید"}>
      <div className="stack">
        <Field label="متن یادداشت" htmlFor={textId} error={error} hint="تاریخ یادداشت به‌صورت خودکار ثبت می‌شود.">
          <Textarea
            id={textId}
            rows={3}
            value={text}
            invalid={!!error}
            placeholder="مثلاً: برای تسویه تا پایان ماه قول داد."
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
          />
        </Field>
        <Button
          block
          onClick={() => {
            if (!text.trim()) {
              setError("متن یادداشت را بنویسید.");
              return;
            }
            onSubmit(text);
          }}
        >
          {editing ? "ذخیرهٔ تغییرات" : "ثبت یادداشت"}
        </Button>
      </div>
    </BottomSheet>
  );
}

/* فرم یادآور */
function ReminderSheet({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; date: string; time: string; description?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("09:00");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<{ title?: string; date?: string; time?: string }>({});
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const titleId = useFieldId();
  const descId = useFieldId();

  useEffect(() => {
    if (open) {
      setTitle("");
      setDate(todayIso());
      setTime("09:00");
      setDesc("");
      setErrors({});
    }
  }, [open]);

  const submit = () => {
    const next: typeof errors = {};
    if (!title.trim()) next.title = "عنوان یادآور را بنویسید.";
    if (!date) next.date = "تاریخ را انتخاب کنید.";
    if (!time) next.time = "ساعت را انتخاب کنید.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ title: title.trim(), date, time, description: desc.trim() || undefined });
    onClose();
  };

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="یادآور جدید">
        <div className="stack">
          <Field label="عنوان" htmlFor={titleId} error={errors.title}>
            <Input
              id={titleId}
              value={title}
              invalid={!!errors.title}
              placeholder="مثلاً پیگیری مانده‌حساب"
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((er) => ({ ...er, title: undefined }));
              }}
            />
          </Field>

          <div className="grid-2">
            <Field label="تاریخ" error={errors.date}>
              <DatePickerTrigger
                value={date ? faDateLong(date) : undefined}
                invalid={!!errors.date}
                onChange={() => setDateOpen(true)}
              />
            </Field>
            <Field label="ساعت" error={errors.time}>
              <button
                type="button"
                className={cn("control date-trigger", errors.time && "is-error")}
                onClick={() => setTimeOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={false}
              >
                <Clock size={20} className="control__icon" aria-hidden />
                <span className="date-trigger__value">{formatTimeFa(time)}</span>
              </button>
            </Field>
          </div>

          <Field label="توضیحات" htmlFor={descId} optional>
            <Textarea
              id={descId}
              rows={2}
              value={desc}
              placeholder="توضیح اختیاری برای یادآور"
              onChange={(e) => setDesc(e.target.value)}
            />
          </Field>

          <Button block icon={<AlarmClock size={18} aria-hidden />} onClick={submit}>
            تنظیم یادآور
          </Button>
        </div>
      </BottomSheet>

      <DateSelectSheet
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        value={date}
        onSelect={(iso) => {
          setDate(iso);
          setErrors((er) => ({ ...er, date: undefined }));
        }}
      />
      <TimeSelectSheet
        open={timeOpen}
        onClose={() => setTimeOpen(false)}
        value={time}
        onSelect={(t) => {
          setTime(t);
          setErrors((er) => ({ ...er, time: undefined }));
        }}
      />
    </>
  );
}

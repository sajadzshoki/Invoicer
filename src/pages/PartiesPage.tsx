import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownUp,
  BookUser,
  Check,
  ListFilter,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { Avatar, ListItem } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { BottomSheet } from "@/components/ui/Overlay";
import { useBookStore } from "@/book/store";
import { computePartySummary } from "@/book/finance";
import type { PartyStatus, Person } from "@/book/types";
import { PartyStatusBadge } from "@/components/party/PartyStatusBadge";
import { ContactsSheet } from "@/components/party/ContactsSheet";
import { faToman, initialsOfName, toEnDigits } from "@/lib/fa";
import { formatPhoneDisplay, normalizePhone } from "@/lib/phone";
import { relativeFaDate } from "@/lib/jalali";
import { cn } from "@/lib/cn";

type BalanceFilter = "all" | PartyStatus;
type SortKey = "recent" | "name" | "balance-desc" | "balance-asc";

const FILTER_OPTIONS: Array<{ id: BalanceFilter; label: string }> = [
  { id: "all", label: "همه" },
  { id: "debtor", label: "بدهکار" },
  { id: "creditor", label: "بستانکار" },
  { id: "settled", label: "تسویه‌شده" },
];

const SORT_OPTIONS: Array<{ id: SortKey; label: string }> = [
  { id: "recent", label: "جدیدترین" },
  { id: "name", label: "نام (الفبا)" },
  { id: "balance-desc", label: "بیشترین مانده" },
  { id: "balance-asc", label: "کمترین مانده" },
];

export function PartiesPage() {
  const navigate = useNavigate();
  const { persons, transactions } = useBookStore();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<BalanceFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  const rows = useMemo(() => {
    return persons.map((person) => {
      const txs = transactions.filter((t) => t.personId === person.id);
      return { person, summary: computePartySummary(txs) };
    });
  }, [persons, transactions]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = toEnDigits(q);
    let list = rows.filter(({ person, summary }) => {
      if (filter !== "all" && summary.status !== filter) return false;
      if (!q) return true;
      const nameMatch = person.name.toLowerCase().includes(q);
      const phoneMatch =
        !!qDigits &&
        !!person.phone &&
        normalizePhone(person.phone).includes(normalizePhone(qDigits));
      return nameMatch || phoneMatch;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.person.name.localeCompare(b.person.name, "fa");
        case "balance-desc":
          return Math.abs(b.summary.balance) - Math.abs(a.summary.balance);
        case "balance-asc":
          return Math.abs(a.summary.balance) - Math.abs(b.summary.balance);
        case "recent":
        default:
          return b.person.createdAt.localeCompare(a.person.createdAt);
      }
    });
    return list;
  }, [rows, query, filter, sort]);

  const hasActiveControls =
    query.trim() !== "" || filter !== "all" || sort !== "recent";

  const clearControls = () => {
    setQuery("");
    setFilter("all");
    setSort("recent");
  };

  const openAdd = () => navigate("/bookAccount/add-customer");
  const openImport = () => setContactsOpen(true);

  return (
    <>
      <PageHeader
        title="طرف حساب‌ها"
        subtitle="دفتر حساب مشتریان و تأمین‌کنندگان"
        actions={
          <Button size="sm" icon={<Plus size={18} aria-hidden />} onClick={openAdd}>
            افزودن طرف حساب
          </Button>
        }
      />

      <div className="page">
        {/* ابزارهای جست‌وجو، فیلتر و مرتب‌سازی */}
        <div className="party-toolbar">
          <SearchInput
            className="party-toolbar__search"
            value={query}
            onValueChange={setQuery}
            placeholder="جست‌وجوی نام یا شمارهٔ تماس…"
            aria-label="جست‌وجوی طرف حساب"
          />
          <div className="party-toolbar__btns">
            <IconButton
              label="فیلتر وضعیت"
              tone={filter !== "all" ? "tint" : "filled"}
              onClick={() => setFilterSheetOpen(true)}
            >
              <ListFilter size={20} aria-hidden />
            </IconButton>
            <IconButton
              label="مرتب‌سازی"
              tone={sort !== "recent" ? "tint" : "filled"}
              onClick={() => setSortSheetOpen(true)}
            >
              <ArrowDownUp size={20} aria-hidden />
            </IconButton>
          </div>
        </div>

        {hasActiveControls && (
          <div className="party-controls-row">
            {filter !== "all" && (
              <button type="button" className="control-chip" onClick={() => setFilter("all")}>
                {FILTER_OPTIONS.find((f) => f.id === filter)?.label}
                <X size={14} aria-hidden />
              </button>
            )}
            {sort !== "recent" && (
              <button type="button" className="control-chip" onClick={() => setSort("recent")}>
                مرتب‌سازی: {SORT_OPTIONS.find((s) => s.id === sort)?.label}
                <X size={14} aria-hidden />
              </button>
            )}
            <Button variant="text" size="sm" onClick={clearControls}>
              پاک‌کردن همه
            </Button>
          </div>
        )}

        {/* محتوا */}
        {persons.length === 0 ? (
          <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <EmptyState
              icon={<Users size={32} aria-hidden />}
              title="هنوز طرف حسابی اضافه نکرده‌اید"
              description="مشتری‌ها و تأمین‌کننده‌های خود را اضافه کنید تا بتوانید حساب و تراکنش‌های آن‌ها را مدیریت کنید."
              actions={
                <>
                  <Button icon={<Plus size={18} aria-hidden />} onClick={openAdd}>
                    افزودن طرف حساب
                  </Button>
                  <Button variant="ghost" icon={<BookUser size={18} aria-hidden />} onClick={openImport}>
                    افزودن از مخاطبین
                  </Button>
                </>
              }
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <EmptyState
              icon={<Search size={30} aria-hidden />}
              title="نتیجه‌ای پیدا نشد"
              description={
                query.trim()
                  ? `برای «${query.trim()}» طرف حسابی با این فیلترها پیدا نشد.`
                  : "هیچ طرف حسابی با این فیلترها وجود ندارد."
              }
              actions={
                <Button variant="secondary" onClick={clearControls}>
                  پاک‌کردن جست‌وجو و فیلترها
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <p className="party-count" aria-live="polite">
              {faCount(visible.length)} طرف حساب
            </p>
            <div className="party-grid">
              {visible.map(({ person, summary }) => (
                <PartyCard
                  key={person.id}
                  person={person}
                  balance={summary.balance}
                  status={summary.status}
                  lastTx={
                    summary.lastTransaction
                      ? {
                          label:
                            summary.lastTransaction.type === "RECEIVED"
                              ? "دریافت"
                              : summary.lastTransaction.type === "PAID"
                                ? "پرداخت"
                                : summary.lastTransaction.type === "SALE_INVOICE"
                                  ? "فاکتور فروش"
                                  : summary.lastTransaction.type === "PURCHASE_INVOICE"
                                    ? "فاکتور خرید"
                                    : "چک",
                          date: summary.lastTransaction.date,
                        }
                      : undefined
                  }
                  onClick={() => navigate(`/bookAccount/${person.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* برگهٔ فیلتر وضعیت */}
      <BottomSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        title="فیلتر وضعیت"
      >
        <div className="list">
          {FILTER_OPTIONS.map((option) => (
            <ListItem
              key={option.id}
              title={option.label}
              end={
                filter === option.id ? <Check size={20} aria-hidden /> : undefined
              }
              onClick={() => {
                setFilter(option.id);
                setFilterSheetOpen(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* برگهٔ مرتب‌سازی */}
      <BottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title="مرتب‌سازی"
      >
        <div className="list">
          {SORT_OPTIONS.map((option) => (
            <ListItem
              key={option.id}
              title={option.label}
              end={sort === option.id ? <Check size={20} aria-hidden /> : undefined}
              onClick={() => {
                setSort(option.id);
                setSortSheetOpen(false);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* برگهٔ مخاطبین — برای حالت خالی فهرست */}
      <ContactsSheet
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
        onPick={(contact) => {
          navigate("/bookAccount/add-customer", {
            state: { imported: contact },
          });
        }}
      />
    </>
  );
}

/* ------------------------------ کارت طرف حساب ------------------------------ */

function PartyCard({
  person,
  balance,
  status,
  lastTx,
  onClick,
}: {
  person: Person;
  balance: number;
  status: PartyStatus;
  lastTx?: { label: string; date: string };
  onClick: () => void;
}) {
  return (
    <button type="button" className="party-card" onClick={onClick}>
      <Avatar label={initialsOfName(person.name)} size="lg" />
      <div className="party-card__body">
        <div className="party-card__top">
          <span className="party-card__name">{person.name}</span>
          <PartyStatusBadge status={status} size="sm" />
        </div>
        <span className="party-card__meta">
          {person.phone ? formatPhoneDisplay(person.phone) : "بدون شمارهٔ تماس"}
        </span>
        {lastTx && (
          <span className="party-card__meta">
            آخرین: {lastTx.label} · {relativeFaDate(lastTx.date)}
          </span>
        )}
      </div>
      <div className={cn("party-card__balance", `party-card__balance--${status}`)}>
        <span className="party-card__amount">{faToman(Math.abs(balance))}</span>
        <span className="party-card__balance-label">
          {status === "settled"
            ? "حساب تسویه"
            : status === "debtor"
              ? "ماندهٔ طلب"
              : "ماندهٔ بدهی"}
        </span>
      </div>
    </button>
  );
}

function faCount(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, SearchX, UserPlus } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { Avatar, ListItem, StatusBadge } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Feedback";
import { useBookStore } from "@/book/store";
import { computePartySummary, STATUS_LABEL } from "@/book/finance";
import type { Person } from "@/book/types";
import { normalizeForSearch } from "@/invoices/helpers";
import { faTomanCompact } from "@/lib/fa";

export interface PartyPickerSheetProps {
  open: boolean;
  onClose: () => void;
  selectedId?: string;
  onSelect: (person: Person) => void;
  /** ساخت طرف حساب جدید — اگر داده نشود، به فرم طرف حساب ناوبری می‌شود */
  onAddNew?: () => void;
}

/**
 * برگهٔ انتخاب طرف حساب برای فاکتور:
 * جستجو + فهرست با مانده/وضعیت + ساخت طرف حساب جدید و بازگشت به جریان فاکتور.
 */
export function PartyPickerSheet({
  open,
  onClose,
  selectedId,
  onSelect,
  onAddNew,
}: PartyPickerSheetProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { persons, transactions } = useBookStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setQuery("");
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    const list = q
      ? persons.filter(
          (p) =>
            normalizeForSearch(p.name).includes(q) ||
            normalizeForSearch(p.phone ?? "").includes(q)
        )
      : persons;
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "fa"));
  }, [persons, query]);

  const addNewParty = () => {
    onClose();
    if (onAddNew) {
      onAddNew();
      return;
    }
    const returnTo = encodeURIComponent(location.pathname + location.search);
    navigate(`/bookAccount/add-customer?returnTo=${returnTo}`);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="انتخاب طرف حساب">
      <SearchInput
        value={query}
        placeholder="جستجوی نام یا شمارهٔ تماس"
        onValueChange={setQuery}
      />

      <div className="mt-4">
        {loading ? (
          <div className="stack" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Skeleton circle width={44} height={44} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="60%" height={11} className="mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="picker-empty">
            <SearchX size={26} aria-hidden />
            <p>طرف حسابی پیدا نشد.</p>
          </div>
        ) : (
          <div className="list">
            {filtered.map((person) => {
              const summary = computePartySummary(
                transactions.filter((t) => t.personId === person.id)
              );
              const selected = person.id === selectedId;
              return (
                <ListItem
                  key={person.id}
                  avatar={<Avatar label={person.name} size="md" />}
                  title={
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      {person.name}
                      {selected && <Check size={16} aria-label="انتخاب شده" />}
                    </span>
                  }
                  caption={
                    summary.balance === 0
                      ? "تسویه‌شده"
                      : `مانده: ${faTomanCompact(summary.balance)}`
                  }
                  end={
                    <StatusBadge
                      tone={
                        summary.status === "debtor"
                          ? "warning"
                          : summary.status === "creditor"
                            ? "info"
                            : "success"
                      }
                    >
                      {STATUS_LABEL[summary.status]}
                    </StatusBadge>
                  }
                  onClick={() => {
                    onSelect(person);
                    onClose();
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="sheet-section">
        <Button
          block
          variant="secondary"
          icon={<UserPlus size={18} aria-hidden />}
          onClick={addNewParty}
        >
          افزودن طرف حساب جدید
        </Button>
      </div>
    </BottomSheet>
  );
}

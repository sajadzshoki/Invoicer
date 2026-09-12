import { useEffect, useMemo, useState } from "react";
import { Landmark, SearchX, XCircle } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { SearchInput } from "@/components/ui/Field";
import { ListItem } from "@/components/ui/Card";
import { IRANIAN_BANKS } from "@/cheques/banks";
import { normalizeForSearch } from "@/invoices/helpers";

export interface BankSheetProps {
  open: boolean;
  onClose: () => void;
  selected?: string;
  onSelect: (bank: string | undefined) => void;
}

/** انتخاب بانک با جستجو و امکان پاک‌کردن — دادهٔ محلی، بدون اتصال بانکی */
export function BankSheet({ open, onClose, selected, onSelect }: BankSheetProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = normalizeForSearch(query);
    return q ? IRANIAN_BANKS.filter((b) => normalizeForSearch(b).includes(q)) : IRANIAN_BANKS;
  }, [query]);

  return (
    <BottomSheet open={open} onClose={onClose} title="انتخاب بانک">
      <SearchInput value={query} placeholder="جستجوی نام بانک" onValueChange={setQuery} />

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="picker-empty">
            <SearchX size={26} aria-hidden />
            <p>بانکی مطابق «{query}» پیدا نشد.</p>
          </div>
        ) : (
          <div className="list">
            {selected && (
              <ListItem
                icon={<XCircle size={20} aria-hidden />}
                title="بدون بانک"
                caption="پاک‌کردن انتخاب فعلی"
                onClick={() => {
                  onSelect(undefined);
                  onClose();
                }}
              />
            )}
            {filtered.map((bank) => (
              <ListItem
                key={bank}
                icon={<Landmark size={20} aria-hidden />}
                tintIcon={bank === selected}
                title={bank}
                className={bank === selected ? "is-picked" : undefined}
                onClick={() => {
                  onSelect(bank);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

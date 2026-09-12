import { useEffect, useState } from "react";
import { BookUser } from "lucide-react";
import { BottomSheet } from "@/components/ui/Overlay";
import { SearchInput } from "@/components/ui/Field";
import { Avatar, ListItem } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Feedback";
import { contactsService } from "@/book/seed";
import type { DeviceContact } from "@/book/types";
import { formatPhoneDisplay, normalizePhone } from "@/lib/phone";
import { initialsOfName, toEnDigits } from "@/lib/fa";

export interface ContactsSheetProps {
  open: boolean;
  onClose: () => void;
  /** پس از انتخاب مخاطب؛ فرم افزودن با نام و شماره پر می‌شود */
  onPick: (contact: DeviceContact) => void;
}

/**
 * افزودن از مخاطبین — در این فاز فهرست نمونه است.
 * معماری طوری است که اتصال بومی به مخاطبین دستگاه در آینده
 * فقط با جایگزینی سرویس `contactsService` انجام می‌شود.
 */
export function ContactsSheet({ open, onClose, onPick }: ContactsSheetProps) {
  const [contacts, setContacts] = useState<DeviceContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    contactsService.list().then((list) => {
      if (!cancelled) {
        setContacts(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const filtered = contacts.filter((c) => {
    const q = toEnDigits(query).trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      normalizePhone(c.phone).includes(normalizePhone(q))
    );
  });

  return (
    <BottomSheet open={open} onClose={onClose} title="افزودن از مخاطبین">
      <SearchInput
        value={query}
        onValueChange={setQuery}
        placeholder="جست‌وجوی مخاطب…"
        aria-label="جست‌وجوی مخاطب"
      />

      <div className="mt-2">
        {loading ? (
          <div role="status" aria-label="در حال بارگذاری مخاطبین">
            <ContactSkeletonRow />
            <ContactSkeletonRow />
            <ContactSkeletonRow />
            <ContactSkeletonRow />
          </div>
        ) : filtered.length === 0 ? (
          <p className="contacts-empty">مخاطبی با این مشخصات پیدا نشد.</p>
        ) : (
          <div className="list">
            {filtered.map((contact) => (
              <ListItem
                key={contact.id}
                avatar={<Avatar label={initialsOfName(contact.name)} size="md" />}
                title={contact.name}
                caption={formatPhoneDisplay(contact.phone)}
                chevron
                onClick={() => {
                  onPick(contact);
                  onClose();
                }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="contacts-note">
        <BookUser size={14} aria-hidden />
        این فهرست نمونه است؛ اتصال به مخاطبین دستگاه در نسخه‌های آینده اضافه می‌شود.
      </p>
    </BottomSheet>
  );
}

function ContactSkeletonRow() {
  return (
    <div className="list-item" aria-hidden>
      <Skeleton circle width={42} height={42} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Skeleton width="40%" height={14} />
        <Skeleton width="55%" height={11} />
      </div>
    </div>
  );
}



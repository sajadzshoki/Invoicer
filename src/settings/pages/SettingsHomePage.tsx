import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { DividerLabel, ListItem } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/Feedback";
import { normalizeForSearch } from "@/invoices/helpers";
import { SETTINGS_ENTRIES, SETTINGS_GROUPS } from "../registry";

/**
 * صفحهٔ اصلی تنظیمات (فاز ۷)
 * گروه‌بندی رسمی + جستجوی سبک روی عنوان/توضیح/کلمه‌های کلیدی که مستقیم
 * به صفحهٔ مربوط می‌رود.
 */
export function SettingsHomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = normalizeForSearch(query);
    if (!q) return null;
    return SETTINGS_ENTRIES.filter((entry) => {
      const haystack = normalizeForSearch(
        [entry.title, entry.caption, ...entry.keywords].join(" ")
      );
      return q.split(/\s+/).every((part) => haystack.includes(part));
    });
  }, [query]);

  return (
    <>
      <PageHeader title="تنظیمات" subtitle="کسب‌وکار، فاکتور، مالی و داده‌ها" />
      <div className="page">
        <section aria-label="جستجوی تنظیمات" className="page__section">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="جستجو در تنظیمات؛ مثل «شماره فاکتور»"
          />
        </section>

        {results ? (
          <section aria-label="نتایج جستجو" className="page__section">
            {results.length === 0 ? (
              <EmptyState
                compact
                icon={<SearchX size={40} aria-hidden />}
                title="نتیجه‌ای پیدا نشد"
                description="عبارت دیگری را امتحان کنید؛ مثل «مالیات» یا «پشتیبان»."
              />
            ) : (
              <div className="list">
                {results.map((entry) => (
                  <ListItem
                    key={`${entry.id}-result`}
                    icon={entry.icon}
                    tintIcon
                    title={entry.title}
                    caption={entry.caption}
                    chevron
                    onClick={() => navigate(entry.path)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          SETTINGS_GROUPS.map((group) => {
            const entries = SETTINGS_ENTRIES.filter((e) => e.group === group.id);
            if (entries.length === 0) return null;
            return (
              <section key={group.id} className="page__section" aria-label={group.title}>
                <DividerLabel>{group.title}</DividerLabel>
                <div className="list">
                  {entries.map((entry) => (
                    <ListItem
                      key={entry.id}
                      icon={entry.icon}
                      tintIcon
                      title={entry.title}
                      caption={entry.caption}
                      chevron
                      onClick={() => navigate(entry.path)}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}

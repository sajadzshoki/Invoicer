import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export function PartiesPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const comingSoon = () =>
    showToast({
      title: "«افزودن طرف حساب» به‌زودی فعال می‌شود",
      description: "مدیریت مشتریان و تأمین‌کنندگان در فازهای بعدی نسق اضافه خواهد شد.",
      variant: "info",
    });

  return (
    <>
      <PageHeader
        title="طرف حساب‌ها"
        subtitle="مشتریان و تأمین‌کنندگان"
        actions={
          <Button size="sm" icon={<Plus size={18} aria-hidden />} onClick={comingSoon}>
            طرف حساب جدید
          </Button>
        }
      />

      <div className="page">
        <div className="stack">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="جست‌وجوی طرف حساب…"
            aria-label="جست‌وجوی طرف حساب"
          />
          <SegmentedControl
            ariaLabel="فیلتر طرف حساب‌ها"
            block
            items={[
              { id: "all", label: "همه" },
              { id: "customers", label: "مشتریان" },
              { id: "suppliers", label: "تأمین‌کنندگان" },
            ]}
            active={filter}
            onChange={setFilter}
          />
        </div>

        <div className="card mt-6" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
          <EmptyState
            icon={<Users size={32} aria-hidden />}
            title="هنوز طرف حسابی اضافه نشده"
            description="مشتریان و تأمین‌کنندگان خود را اضافه کنید تا حساب، فاکتور و تراکنش‌هایشان به‌سادگی در دسترس باشد."
            actions={
              <Button icon={<Plus size={18} aria-hidden />} onClick={comingSoon}>
                افزودن طرف حساب
              </Button>
            }
          />
        </div>
      </div>
    </>
  );
}

import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/ui/Field";
import { SegmentedControl } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

export function ProductsPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("goods");

  const comingSoon = () =>
    showToast({
      title: "«افزودن کالا» به‌زودی فعال می‌شود",
      description: "مدیریت کالاها و خدمات در فازهای بعدی نسق اضافه خواهد شد.",
      variant: "info",
    });

  return (
    <>
      <PageHeader
        title="کالاها"
        subtitle="کالاها و خدمات شما"
        actions={
          <Button size="sm" icon={<Plus size={18} aria-hidden />} onClick={comingSoon}>
            کالای جدید
          </Button>
        }
      />

      <div className="page">
        <div className="stack">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="جست‌وجوی کالا یا خدمت…"
            aria-label="جست‌وجوی کالا"
          />
          <SegmentedControl
            ariaLabel="نوع اقلام"
            block
            items={[
              { id: "goods", label: "کالا" },
              { id: "services", label: "خدمت" },
            ]}
            active={kind}
            onChange={setKind}
          />
        </div>

        <div className="card mt-6" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
          <EmptyState
            icon={<Package size={32} aria-hidden />}
            title="هنوز کالایی ثبت نشده"
            description="کالاها و خدمات خود را با قیمت و موجودی ثبت کنید تا هنگام صدور فاکتور سریع انتخاب شوند."
            actions={
              <Button icon={<Plus size={18} aria-hidden />} onClick={comingSoon}>
                افزودن کالا
              </Button>
            }
          />
        </div>
      </div>
    </>
  );
}

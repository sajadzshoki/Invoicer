import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";

const TABS = [
  { id: "all", label: "همه", count: 0 },
  { id: "sales", label: "فروش", count: 0 },
  { id: "purchases", label: "خرید", count: 0 },
  { id: "drafts", label: "پیش‌فاکتور", count: 0 },
];

const TAB_COPY: Record<string, { title: string; description: string }> = {
  all: {
    title: "هنوز فاکتوری ثبت نشده",
    description:
      "با ثبت اولین فاکتور، خلاصهٔ فروش، وضعیت پرداخت و مانده‌حساب‌ها اینجا نمایش داده می‌شود.",
  },
  sales: {
    title: "هنوز فاکتور فروشی ثبت نشده",
    description: "فاکتورهای فروش شما پس از ثبت در این فهرست قرار می‌گیرند.",
  },
  purchases: {
    title: "هنوز فاکتور خریدی ثبت نشده",
    description: "فاکتورهای خرید از تأمین‌کنندگان پس از ثبت اینجا نمایش داده می‌شود.",
  },
  drafts: {
    title: "هنوز پیش‌فاکتوری ندارید",
    description: "پیش‌فاکتورها برای ارسال به مشتری پیش از قطعی‌شدن فروش استفاده می‌شوند.",
  },
};

export function InvoicesPage() {
  const { showToast } = useToast();
  const [tab, setTab] = useState("all");

  const comingSoon = () =>
    showToast({
      title: "«ثبت فاکتور» به‌زودی فعال می‌شود",
      description: "صدور فاکتور فروش و خرید در فازهای بعدی نسق اضافه خواهد شد.",
      variant: "info",
    });

  const copy = TAB_COPY[tab] ?? TAB_COPY.all;

  return (
    <>
      <PageHeader
        title="فاکتورها"
        subtitle="فروش، خرید و پیش‌فاکتورها"
        actions={
          <Button size="sm" icon={<Plus size={18} aria-hidden />} onClick={comingSoon}>
            فاکتور جدید
          </Button>
        }
      />

      <div className="page">
        <Tabs
          ariaLabel="دسته‌های فاکتور"
          tabs={TABS}
          active={tab}
          onChange={setTab}
        />

        <div className="card mt-6" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
          <EmptyState
            icon={<FileText size={32} aria-hidden />}
            title={copy.title}
            description={copy.description}
            actions={
              <Button icon={<Plus size={18} aria-hidden />} onClick={comingSoon}>
                ثبت فاکتور
              </Button>
            }
          />
        </div>
      </div>
    </>
  );
}

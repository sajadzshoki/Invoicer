import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, ScrollText } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Card";
import { useInvoiceStore } from "@/invoices/store";
import { useBookStore } from "@/book/store";
import {
  faInvoiceNumber,
  INVOICE_TYPE_LABEL,
} from "@/invoices/helpers";
import { faToman } from "@/lib/fa";

/**
 * نقطهٔ اتصال فاکتور به چک (فاز ۴ → فاز ۵)
 * فرم کامل چک در فاز بعدی پیاده می‌شود؛ تا آن زمان فاکتور چکی در وضعیت
 * «در انتظار تسویه» می‌ماند و هیچ اثر مالی‌ای بر ماندهٔ طرف حساب نمی‌گذارد.
 */
export function ChequeAddPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const invoiceStore = useInvoiceStore();
  const { persons } = useBookStore();

  const invoice = invoiceId ? invoiceStore.getInvoice(invoiceId) : undefined;
  const party = persons.find((p) => p.id === invoice?.personId);

  return (
    <>
      <PageHeader title="ثبت چک" subtitle="اتصال فاکتور به چک" onBack />
      <div className="page">
        {invoice ? (
          <div className="card mb-4">
            <div className="stack" style={{ gap: "var(--space-2)" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge tone="primary">{INVOICE_TYPE_LABEL[invoice.type]}</Badge>
                <Badge tone="outline">{faInvoiceNumber(invoice.invoiceNumber)}</Badge>
              </div>
              <p>{party?.name ?? "—"}</p>
              <p style={{ fontWeight: "var(--weight-heavy)" }}>
                {faToman(invoice.totalAmount)}
              </p>
            </div>
          </div>
        ) : (
          <p className="inv-muted mb-4">فاکتور مرتبط پیدا نشد.</p>
        )}

        <EmptyState
          icon={<ScrollText size={30} aria-hidden />}
          title="ماژول چک در فاز بعدی فعال می‌شود"
          description="تا ثبت چک، این فاکتور «در انتظار تسویه» می‌ماند و اثر مالی آن بر ماندهٔ طرف حساب اعمال نمی‌شود."
          actions={
            <div className="stack" style={{ gap: "var(--space-2)" }}>
              {invoice && (
                <Button
                  icon={<ArrowRight size={18} aria-hidden />}
                  onClick={() => navigate(`/invoices/invoice/${invoice.id}`)}
                >
                  بازگشت به فاکتور
                </Button>
              )}
              <Button variant="ghost" onClick={() => navigate("/invoices/invoice/list")}>
                فهرست فاکتورها
              </Button>
            </div>
          }
        />
      </div>
    </>
  );
}

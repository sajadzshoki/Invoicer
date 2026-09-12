import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { faNum, faTomanCompact } from "@/lib/fa";
import { useReportData } from "@/reports/selectors/dataSource";
import {
  getProductPerformance,
  PRODUCT_SORT_LABEL,
  type ProductSortKey,
} from "@/reports/selectors/products";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
  CsvExportButton,
} from "@/reports/components/ReportLayout";
import { ReportTable, ReportTableSkeleton } from "@/reports/components/ReportTable";

const SORTS: ProductSortKey[] = ["salesAmount", "soldQuantity", "lowestStock", "name"];

/** عملکرد کالاها و خدمات (فاز ۶) — فروش/خرید از فاکتورها، نه حرکات انبار */
export function ProductPerformancePage() {
  const data = useReportData();
  const { range } = useReportRange();
  const navigate = useNavigate();
  const [sort, setSort] = useState<ProductSortKey>("salesAmount");
  const [typeFilter, setTypeFilter] = useState<"all" | "PRODUCT" | "SERVICE">("all");

  const { loading, data: report, error, retry } = useReport(
    () => getProductPerformance(data, range, sort),
    [data, range, sort]
  );

  const rows = useMemo(
    () => (report ? report.filter((r) => typeFilter === "all" || r.product.type === typeFilter) : []),
    [report, typeFilter]
  );

  if (error) {
    return (
      <ReportLayout title="عملکرد کالاها و خدمات" subtitle="فروش، خرید و موجودی هر قلم">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const csvHeaders = [
    "نام",
    "نوع",
    "تعداد فروش",
    "مبلغ فروش (تومان)",
    "تعداد خرید",
    "مبلغ خرید (تومان)",
    "موجودی فعلی",
  ];
  const csvRows = rows.map((row) => [
    row.product.name,
    row.product.type === "PRODUCT" ? "کالا" : "خدمت",
    row.soldQuantity,
    row.soldAmount,
    row.purchasedQuantity,
    row.purchasedAmount,
    row.product.type === "PRODUCT" ? row.product.currentStock ?? 0 : "",
  ]);

  return (
    <ReportLayout
      title="عملکرد کالاها و خدمات"
      subtitle="تعداد و مبالغ از فاکتورهای قطعی — خدمات موجودی ندارند"
      actions={
        <CsvExportButton
          fileName="nasagh-product-performance"
          headers={csvHeaders}
          rows={csvRows}
          disabled={!report || rows.length === 0}
        />
      }
    >
      {/* مرتب‌سازی و فیلتر */}
      <section className="no-print" aria-label="مرتب‌سازی و فیلتر">
        <div className="filter-chips" role="group" aria-label="مرتب‌سازی">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              className={cn("filter-chip", sort === s && "is-active")}
              aria-pressed={sort === s}
              onClick={() => setSort(s)}
            >
              {PRODUCT_SORT_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="filter-chips mt-2" role="group" aria-label="فیلتر نوع قلم">
          {(["all", "PRODUCT", "SERVICE"] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={cn("filter-chip", typeFilter === t && "is-active")}
              aria-pressed={typeFilter === t}
              onClick={() => setTypeFilter(t)}
            >
              {t === "all" ? "همه" : t === "PRODUCT" ? "کالاها" : "خدمات"}
            </button>
          ))}
          {(typeFilter !== "all" || sort !== "salesAmount") && (
            <button
              type="button"
              className="filter-chip filter-chip--clear"
              onClick={() => {
                setTypeFilter("all");
                setSort("salesAmount");
              }}
            >
              بازنشانی ✕
            </button>
          )}
        </div>
      </section>

      {!report || loading ? (
        <section className="page__section" role="status" aria-label="در حال بارگذاری">
          <div className="card" style={{ padding: "var(--space-4)" }}>
            <ReportTableSkeleton rows={5} cols={6} />
          </div>
        </section>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Package size={30} aria-hidden />}
            title="قلمی برای نمایش وجود ندارد"
            description="در بازهٔ انتخابی فاکتوری برای این اقلام ثبت نشده است."
          />
        </div>
      ) : (
        <section aria-label="جدول عملکرد">
          <div className="card rt-card">
            <ReportTable
              ariaLabel="عملکرد کالاها و خدمات"
              rows={rows}
              rowKey={(row) => row.product.id}
              onRowClick={(row) => navigate(`/products/${row.product.id}`)}
              columns={[
                {
                  key: "name",
                  header: "نام",
                  render: (row) => (
                    <span className="rt__name-cell">
                      <strong>{row.product.name}</strong>
                      <Badge tone="outline">
                        {row.product.type === "PRODUCT" ? "کالا" : "خدمت"}
                      </Badge>
                    </span>
                  ),
                },
                {
                  key: "soldQty",
                  header: "تعداد فروش",
                  align: "end",
                  render: (row) => faNum(row.soldQuantity),
                },
                {
                  key: "soldAmount",
                  header: "مبلغ فروش",
                  align: "end",
                  render: (row) => (
                    <strong>{faTomanCompact(row.soldAmount)}</strong>
                  ),
                },
                {
                  key: "purchaseQty",
                  header: "تعداد خرید",
                  align: "end",
                  render: (row) => faNum(row.purchasedQuantity),
                },
                {
                  key: "purchaseAmount",
                  header: "مبلغ خرید",
                  align: "end",
                  render: (row) => faTomanCompact(row.purchasedAmount),
                },
                {
                  key: "stock",
                  header: "موجودی فعلی",
                  align: "end",
                  render: (row) =>
                    row.product.type === "PRODUCT"
                      ? `${faNum(row.product.currentStock ?? 0)}${
                          row.product.unit ? ` ${row.product.unit}` : ""
                        }`
                      : "—",
                },
              ]}
            />
          </div>
        </section>
      )}
    </ReportLayout>
  );
}

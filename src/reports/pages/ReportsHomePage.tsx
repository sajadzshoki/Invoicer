import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Boxes,
  FileSignature,
  HandCoins,
  PiggyBank,
  ReceiptText,
  Scale,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { ListItem } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Feedback";
import { faTomanCompact } from "@/lib/fa";
import { useReportData } from "@/reports/selectors/dataSource";
import { getDashboardSummary } from "@/reports/selectors/summary";
import { useReportRange } from "@/reports/dateRange/ReportRangeContext";
import {
  ReportLayout,
  ReportErrorState,
  useReport,
} from "@/reports/components/ReportLayout";
import { SummaryCards, type SummaryMetric } from "@/reports/components/SummaryCards";

/** صفحهٔ اصلی گزارش‌ها — داشبورد تحلیلی خواندنی (فاز ۶) */
export function ReportsHomePage() {
  const data = useReportData();
  const { range } = useReportRange();

  const { loading, data: summary, error, retry } = useReport(
    () => getDashboardSummary(data, range),
    [data, range]
  );

  if (error) {
    return (
      <ReportLayout title="گزارش‌ها" subtitle="نمای کلی وضعیت مالی و عملکرد کسب‌وکار">
        <ReportErrorState onRetry={retry} />
      </ReportLayout>
    );
  }

  const metrics: SummaryMetric[] = summary
    ? [
        {
          id: "sales",
          label: "فروش",
          value: faTomanCompact(summary.sales),
          caption: "فاکتورهای فروش قطعی",
          tone: "primary",
          to: "/reports/sales",
        },
        {
          id: "purchases",
          label: "خرید",
          value: faTomanCompact(summary.purchases),
          caption: "فاکتورهای خرید قطعی",
          tone: "neutral",
          to: "/reports/purchases",
        },
        {
          id: "income",
          label: "درآمد",
          value: faTomanCompact(summary.income),
          caption: "ثبت‌شده در هزینه‌ها و درآمدها",
          tone: "income",
          to: "/reports/income-expense",
        },
        {
          id: "expense",
          label: "هزینه",
          value: faTomanCompact(summary.expense),
          caption: "ثبت‌شده در هزینه‌ها و درآمدها",
          tone: "expense",
          to: "/reports/income-expense",
        },
        {
          id: "net",
          label: "سود خالص",
          value: faTomanCompact(summary.registeredNet),
          caption: "خالص درآمد و هزینهٔ ثبت‌شده",
          tone: summary.registeredNet >= 0 ? "income" : "expense",
          to: "/reports/profit-loss",
        },
        {
          id: "receivables",
          label: "طلب",
          value: faTomanCompact(summary.receivables),
          caption: "ماندهٔ لحظه‌ای — بدون محدودیت بازه",
          tone: "receivable",
          to: "/reports/receivables",
        },
        {
          id: "payables",
          label: "بدهی",
          value: faTomanCompact(summary.payables),
          caption: "ماندهٔ لحظه‌ای — بدون محدودیت بازه",
          tone: "debt",
          to: "/reports/receivables",
        },
      ]
    : [];

  return (
    <ReportLayout
      title="گزارش‌ها"
      subtitle="نمای کلی وضعیت مالی و عملکرد کسب‌وکار"
    >
      {/* کارت‌های خلاصه */}
      <section className="page__section" aria-label="خلاصهٔ مالی">
        {loading ? (
          <div className="metric-grid" role="status" aria-label="در حال بارگذاری">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="card" style={{ padding: "var(--space-4)" }}>
                <Skeleton width="50%" height={12} />
                <Skeleton width="80%" height={18} className="mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <SummaryCards metrics={metrics} ariaLabel="خلاصهٔ مالی بازهٔ انتخابی" />
        )}
      </section>

      {/* فهرست گزارش‌ها */}
      <ReportIndex />
    </ReportLayout>
  );
}

/* ------------------------------ فهرست گزارش‌ها ------------------------------ */

const REPORT_GROUPS: Array<{
  title: string;
  items: Array<{
    id: string;
    title: string;
    caption: string;
    icon: React.ReactNode;
    path: string;
  }>;
}> = [
  {
    title: "مالی",
    items: [
      {
        id: "sales",
        title: "فروش",
        caption: "مجموع، روند زمانی و تفکیک فاکتورهای فروش",
        icon: <ShoppingCart size={20} aria-hidden />,
        path: "/reports/sales",
      },
      {
        id: "purchases",
        title: "خرید",
        caption: "مجموع، روند زمانی و تفکیک فاکتورهای خرید",
        icon: <ArrowLeftRight size={20} aria-hidden />,
        path: "/reports/purchases",
      },
      {
        id: "profit-loss",
        title: "سود و زیان",
        caption: "درآمد و هزینهٔ ثبت‌شده و نمای فروش/خرید",
        icon: <Scale size={20} aria-hidden />,
        path: "/reports/profit-loss",
      },
      {
        id: "income-expense",
        title: "درآمد و هزینه",
        caption: "رکوردهای ثبت‌شدهٔ عمومی کسب‌وکار",
        icon: <PiggyBank size={20} aria-hidden />,
        path: "/reports/income-expense",
      },
      {
        id: "receivables",
        title: "طلب و بدهی",
        caption: "ماندهٔ بدهکاران و بستانکاران",
        icon: <HandCoins size={20} aria-hidden />,
        path: "/reports/receivables",
      },
    ],
  },
  {
    title: "انبار",
    items: [
      {
        id: "inventory",
        title: "موجودی",
        caption: "ارزش تقریبی، کم‌موجودی و ناموجودی",
        icon: <Boxes size={20} aria-hidden />,
        path: "/reports/inventory",
      },
      {
        id: "movements",
        title: "گردش کالا",
        caption: "ورود و خروج انبار با منبع حرکت",
        icon: <ReceiptText size={20} aria-hidden />,
        path: "/reports/inventory/movements",
      },
      {
        id: "products",
        title: "عملکرد کالاها",
        caption: "فروش، خرید و موجودی هر قلم",
        icon: <TrendingUp size={20} aria-hidden />,
        path: "/reports/products",
      },
    ],
  },
  {
    title: "چک",
    items: [
      {
        id: "cheques",
        title: "گزارش چک‌ها",
        caption: "وضعیت، سررسید نزدیک و تعهدات پرداخت",
        icon: <FileSignature size={20} aria-hidden />,
        path: "/reports/cheques",
      },
    ],
  },
];

function ReportIndex() {
  const navigate = useNavigate();

  return (
    <>
      {REPORT_GROUPS.map((group) => (
        <section key={group.title} className="page__section" aria-label={`گزارش‌های ${group.title}`}>
          <div className="section-head">
            <h2>{group.title}</h2>
          </div>
          <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            <div className="list">
              {group.items.map((item) => (
                <ListItem
                  key={item.id}
                  tintIcon
                  icon={item.icon}
                  title={item.title}
                  caption={item.caption}
                  chevron
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

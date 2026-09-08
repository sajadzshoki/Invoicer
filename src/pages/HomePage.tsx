import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  FilePlus2,
  HandCoins,
  Inbox,
  Receipt,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Avatar } from "@/components/ui/Card";
import { IconButton, Button } from "@/components/ui/Button";
import { EmptyState, SkeletonListItem } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import {
  faGreeting,
  faNum,
  faTodayFull,
} from "@/lib/fa";

const USER = { name: "مریم", initials: "م‌ر" };

/* داده‌های نمونهٔ فاز ۱ — صرفاً برای نمایش ظاهر داشبورد */
const SAMPLE = {
  balance: 124_580_000,
  delta: "+۱۲٪ نسبت به ماه قبل",
  income: 86.4,
  incomeCaption: "۱۲٪ بیشتر از ماه قبل",
  expense: 32.2,
  expenseCaption: "۴٪ کمتر از ماه قبل",
  receivable: 18.7,
  receivableCaption: "از ۳ مشتری",
  debt: 9.2,
  debtCaption: "به ۲ تأمین‌کننده",
};

const QUICK_ACTIONS: Array<{ id: string; label: string; icon: ReactNode }> = [
  { id: "invoice", label: "ثبت فاکتور", icon: <FilePlus2 size={22} aria-hidden /> },
  { id: "party", label: "افزودن طرف حساب", icon: <UserPlus size={22} aria-hidden /> },
  { id: "expense", label: "ثبت هزینه", icon: <Receipt size={22} aria-hidden /> },
  { id: "receive", label: "ثبت دریافت", icon: <HandCoins size={22} aria-hidden /> },
];

export function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loadingActivity, setLoadingActivity] = useState(true);

  // شبیه‌سازی بارگذاری اولیهٔ «آخرین تراکنش‌ها» — نمایش اسکلت
  useEffect(() => {
    const t = window.setTimeout(() => setLoadingActivity(false), 1600);
    return () => window.clearTimeout(t);
  }, []);

  const comingSoon = (label: string) =>
    showToast({
      title: `«${label}» به‌زودی فعال می‌شود`,
      description: "این قابلیت در فازهای بعدی نسق اضافه خواهد شد.",
      variant: "info",
    });

  const runQuickAction = (id: string, label: string) => {
    if (id === "party") {
      navigate("/bookAccount/add-customer");
      return;
    }
    comingSoon(label);
  };

  return (
    <>
      <PageHeader
        title="خانه"
        subtitle="فروشگاه آرمان"
        actions={
          <>
            <IconButton
              label="اعلان‌ها"
              tone="filled"
              onClick={() =>
                showToast({
                  title: "اعلان‌ها به‌زودی فعال می‌شوند",
                  variant: "info",
                })
              }
            >
              <Bell size={20} aria-hidden />
            </IconButton>
            <Avatar label={USER.initials} size="md" />
          </>
        }
      />

      <div className="page">
        {/* سلام و خوش‌آمدگویی */}
        <section className="home-greeting" aria-label="خوش‌آمدگویی">
          <div className="home-greeting__texts">
            <h2 className="home-greeting__hello">
              سلام، {USER.name} 👋
            </h2>
            <p className="home-greeting__date">
              {faGreeting()} · {faTodayFull()}
            </p>
          </div>
        </section>

        {/* وضعیت مالی کلی */}
        <section aria-label="وضعیت مالی کلی">
          <div className="balance-card">
            <div className="balance-card__head">
              <span className="balance-card__label">
                <Wallet size={18} aria-hidden />
                وضعیت مالی کلی
              </span>
            </div>
            <p className="balance-card__amount">
              {faNum(SAMPLE.balance)}
              <span className="amount-unit">تومان</span>
            </p>
            <span className="balance-card__delta">
              <TrendingUp size={14} aria-hidden />
              {SAMPLE.delta}
            </span>
            <Sparkline />
          </div>
        </section>

        {/* خلاصهٔ درآمد، هزینه، طلب و بدهی */}
        <section className="page__section" aria-label="خلاصه مالی">
          <div className="stat-grid">
            <StatCard
              tone="income"
              icon={<TrendingUp size={18} aria-hidden />}
              label="درآمد این ماه"
              value={SAMPLE.income}
              caption={SAMPLE.incomeCaption}
            />
            <StatCard
              tone="expense"
              icon={<TrendingDown size={18} aria-hidden />}
              label="هزینه این ماه"
              value={SAMPLE.expense}
              caption={SAMPLE.expenseCaption}
            />
            <StatCard
              tone="receivable"
              icon={<HandCoins size={18} aria-hidden />}
              label="طلب از مشتریان"
              value={SAMPLE.receivable}
              caption={SAMPLE.receivableCaption}
            />
            <StatCard
              tone="debt"
              icon={<Receipt size={18} aria-hidden />}
              label="بدهی به دیگران"
              value={SAMPLE.debt}
              caption={SAMPLE.debtCaption}
            />
          </div>
        </section>

        {/* اقدامات سریع */}
        <section className="page__section" aria-label="اقدامات سریع">
          <div className="section-head">
            <h2>اقدامات سریع</h2>
          </div>
          <div className="qa-grid">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className="qa"
                onClick={() => runQuickAction(action.id, action.label)}
              >
                <span className="qa__icon" aria-hidden>
                  {action.icon}
                </span>
                <span className="qa__label">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* آخرین تراکنش‌ها — اسکلت و سپس وضعیت خالی */}
        <section className="page__section" aria-label="آخرین تراکنش‌ها">
          <div className="section-head">
            <h2>آخرین تراکنش‌ها</h2>
          </div>
          <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            {loadingActivity ? (
              <div role="status" aria-label="در حال بارگذاری تراکنش‌ها">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
              </div>
            ) : (
              <EmptyState
                compact
                icon={<Inbox size={30} aria-hidden />}
                title="هنوز تراکنشی وجود ندارد"
                description="اولین درآمد یا هزینهٔ خود را ثبت کنید تا اینجا نمایش داده شود."
                actions={
                  <Button variant="secondary" onClick={() => comingSoon("ثبت تراکنش")}>
                    ثبت اولین تراکنش
                  </Button>
                }
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

/* کارت آمار کوچک */
function StatCard({
  tone,
  icon,
  label,
  value,
  caption,
}: {
  tone: "income" | "expense" | "receivable" | "debt";
  icon: ReactNode;
  label: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card__head">
        <span className={`stat-card__chip stat-card__chip--${tone}`} aria-hidden>
          {icon}
        </span>
        <span className="stat-card__label">{label}</span>
      </div>
      <p className="stat-card__value">
        {faNum(value, { decimals: 1 })}{" "}
        <span className="amount-unit">میلیون تومان</span>
      </p>
      <span className="stat-card__caption">{caption}</span>
    </div>
  );
}

/* نمودار کوچک روند — دادهٔ نمونهٔ ثابت */
function Sparkline() {
  return (
    <div className="balance-card__spark" dir="ltr" aria-hidden>
      <svg width="100%" height="44" viewBox="0 0 320 44" preserveAspectRatio="none">
        <path
          d="M0 36 C 28 34, 42 28, 66 29 S 110 36, 134 31 S 178 16, 202 18 S 246 24, 270 16 S 306 8, 320 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="320" cy="6" r="3.5" fill="currentColor" />
      </svg>
    </div>
  );
}

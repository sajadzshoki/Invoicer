import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  FilePlus2,
  FileSignature,
  HandCoins,
  Inbox,
  PiggyBank,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Avatar, ListItem } from "@/components/ui/Card";
import { IconButton, Button } from "@/components/ui/Button";
import { EmptyState, SkeletonListItem } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { useBookStore } from "@/book/store";
import { computePartySummary } from "@/book/finance";
import { useChequeStore } from "@/cheques/store";
import { computeChequeSummary } from "@/cheques/helpers";
import { useCostStore } from "@/costs/store";
import {
  faGreeting,
  faNum,
  faTomanCompact,
  faTodayFull,
} from "@/lib/fa";
import { isoToJalali, todayIso, todayJalali } from "@/lib/jalali";

const USER = { name: "مریم", initials: "م‌ر" };

const QUICK_ACTIONS: Array<{ id: string; label: string; icon: ReactNode }> = [
  { id: "invoice", label: "ثبت فاکتور", icon: <FilePlus2 size={22} aria-hidden /> },
  { id: "cheque", label: "ثبت چک", icon: <FileSignature size={22} aria-hidden /> },
  { id: "expense", label: "ثبت هزینه", icon: <Receipt size={22} aria-hidden /> },
  { id: "income", label: "ثبت درآمد", icon: <PiggyBank size={22} aria-hidden /> },
];

export function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { persons, transactions } = useBookStore();
  const chequeStore = useChequeStore();
  const { costs } = useCostStore();
  const [loadingActivity, setLoadingActivity] = useState(true);

  // شبیه‌سازی بارگذاری اولیه — نمایش اسکلت
  useEffect(() => {
    const t = window.setTimeout(() => setLoadingActivity(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  /* مانده‌ها و طلب/بدهی — مشتق‌شده از رکوردهای دفتر حساب (بدون ذخیرهٔ تکراری) */
  const finance = useMemo(() => {
    let receivable = 0;
    let payable = 0;
    for (const person of persons) {
      const summary = computePartySummary(
        transactions.filter((t) => t.personId === person.id)
      );
      receivable += summary.receivable;
      payable += summary.payable;
    }
    return { receivable, payable, net: receivable - payable };
  }, [persons, transactions]);

  /* درآمد و هزینهٔ ماه جاری — از ماژول هزینه‌ها و درآمدها */
  const monthMoney = useMemo(() => {
    const today = todayJalali();
    let income = 0;
    let expense = 0;
    for (const cost of costs) {
      const j = isoToJalali(cost.date);
      if (!j || j.jy !== today.jy || j.jm !== today.jm) continue;
      if (cost.type === "INCOME") income += cost.amount;
      else expense += cost.amount;
    }
    return { income, expense };
  }, [costs]);

  /* چک‌های در انتظار با سررسید نزدیک */
  const chequeSoon = useMemo(
    () => computeChequeSummary(chequeStore.cheques, todayIso()),
    [chequeStore.cheques]
  );

  /* آخرین رکوردهای هزینه/درآمد برای بخش «آخرین تراکنش‌ها» */
  const recentCosts = useMemo(
    () =>
      [...costs]
        .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
        .slice(0, 5),
    [costs]
  );

  const runQuickAction = (id: string) => {
    if (id === "invoice") navigate("/invoices/add");
    else if (id === "cheque") navigate("/cheque/add");
    else if (id === "expense") navigate("/costs/add?type=EXPENSE");
    else if (id === "income") navigate("/costs/add?type=INCOME");
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
            <p className="balance-card__amount">{faTomanCompact(finance.net)}</p>
            <span className="balance-card__delta">
              {finance.net >= 0 ? (
                <>
                  <TrendingUp size={14} aria-hidden />
                  جمع طلب‌ها منهای بدهی‌ها
                </>
              ) : (
                <>
                  <TrendingDown size={14} aria-hidden />
                  بدهی‌ها بیشتر از طلب‌هاست
                </>
              )}
            </span>
          </div>
        </section>

        {/* خلاصهٔ درآمد، هزینه، طلب و بدهی */}
        <section className="page__section" aria-label="خلاصه مالی">
          <div className="stat-grid">
            <StatCard
              tone="income"
              icon={<TrendingUp size={18} aria-hidden />}
              label="درآمد این ماه"
              value={faTomanCompact(monthMoney.income)}
              caption="از ماژول هزینه‌ها و درآمدها"
            />
            <StatCard
              tone="expense"
              icon={<TrendingDown size={18} aria-hidden />}
              label="هزینه این ماه"
              value={faTomanCompact(monthMoney.expense)}
              caption="از ماژول هزینه‌ها و درآمدها"
            />
            <StatCard
              tone="receivable"
              icon={<HandCoins size={18} aria-hidden />}
              label="طلب از مشتریان"
              value={faTomanCompact(finance.receivable)}
              caption="مانده‌های بدهکار دفتر حساب"
            />
            <StatCard
              tone="debt"
              icon={<Receipt size={18} aria-hidden />}
              label="بدهی به دیگران"
              value={faTomanCompact(finance.payable)}
              caption="مانده‌های بستانکار دفتر حساب"
            />
          </div>
        </section>

        {/* چک‌های با سررسید نزدیک */}
        <section className="page__section" aria-label="چک‌های پیش رو">
          <div className="section-head">
            <h2>چک‌های پیش رو</h2>
            <Button variant="text" size="sm" onClick={() => navigate("/cheque/list")}>
              مشاهدهٔ همه
            </Button>
          </div>
          {chequeSoon.dueSoonCount === 0 ? (
            <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
              <EmptyState
                compact
                icon={<FileSignature size={28} aria-hidden />}
                title="چکی با سررسید نزدیک نیست"
                description="چک‌های در انتظار وصول که سررسیدشان نزدیک باشد اینجا نمایش داده می‌شوند."
              />
            </div>
          ) : (
            <button
              type="button"
              className="home-cheque-banner"
              onClick={() => navigate("/cheque/list")}
            >
              <span className="home-cheque-banner__icon" aria-hidden>
                <FileSignature size={20} />
              </span>
              <span className="home-cheque-banner__body">
                <strong>
                  {faNum(chequeSoon.dueSoonCount)} چک با سررسید تا هفتهٔ دیگر
                </strong>
                <span>مجموع {faTomanCompact(chequeSoon.dueSoonAmount)}</span>
              </span>
              <span className="home-cheque-banner__hint">مشاهده</span>
            </button>
          )}
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
                onClick={() => runQuickAction(action.id)}
              >
                <span className="qa__icon" aria-hidden>
                  {action.icon}
                </span>
                <span className="qa__label">{action.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* آخرین رکوردهای هزینه/درآمد */}
        <section className="page__section" aria-label="آخرین تراکنش‌ها">
          <div className="section-head">
            <h2>آخرین تراکنش‌ها</h2>
            <Button variant="text" size="sm" onClick={() => navigate("/costs")}>
              مشاهدهٔ همه
            </Button>
          </div>
          <div className="card" style={{ paddingInline: 0, paddingBlock: "var(--space-2)" }}>
            {loadingActivity ? (
              <div role="status" aria-label="در حال بارگذاری تراکنش‌ها">
                <SkeletonListItem />
                <SkeletonListItem />
                <SkeletonListItem />
              </div>
            ) : recentCosts.length === 0 ? (
              <EmptyState
                compact
                icon={<Inbox size={30} aria-hidden />}
                title="هنوز رکوردی وجود ندارد"
                description="اولین هزینه یا درآمد خود را ثبت کنید تا اینجا نمایش داده شود."
                actions={
                  <Button variant="secondary" onClick={() => navigate("/costs/add")}>
                    ثبت اولین رکورد
                  </Button>
                }
              />
            ) : (
              <div className="list">
                {recentCosts.map((cost) => {
                  const isIncome = cost.type === "INCOME";
                  return (
                    <ListItem
                      key={cost.id}
                      tintIcon
                      icon={
                        isIncome ? (
                          <ArrowUpRight size={18} aria-hidden />
                        ) : (
                          <ArrowDownLeft size={18} aria-hidden />
                        )
                      }
                      title={cost.title}
                      caption={isIncome ? "درآمد" : "هزینه"}
                      end={
                        <strong className={isIncome ? "fin-income-text" : "fin-expense-text"}>
                          {isIncome ? "+" : "−"}
                          {faTomanCompact(cost.amount)}
                        </strong>
                      }
                      chevron
                      onClick={() => navigate(`/costs/${cost.id}`)}
                    />
                  );
                })}
              </div>
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
  value: string;
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
      <p className="stat-card__value">{value}</p>
      <span className="stat-card__caption">{caption}</span>
    </div>
  );
}

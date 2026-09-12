import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Badge } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/Feedback";
import { ListItem } from "@/components/ui/Card";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { useCostStore } from "@/costs/store";
import { faToman, toFaDigits } from "@/lib/fa";
import { faDateLong, relativeFaDate } from "@/lib/jalali";

/** صفحهٔ جزئیات یک رکورد هزینه یا درآمد */
export function CostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const store = useCostStore();

  const cost = id ? store.getCost(id) : undefined;
  const category = cost ? store.getCategory(cost.categoryId) : undefined;

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, [id]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading) {
    return (
      <>
        <PageHeader title="جزئیات رکورد" onBack />
        <div className="page">
          <div className="card">
            <Skeleton width="50%" height={16} />
            <Skeleton width="70%" height={13} className="mt-3" />
            <Skeleton width="35%" height={20} className="mt-3" />
          </div>
        </div>
      </>
    );
  }

  if (!cost) {
    return (
      <>
        <PageHeader title="جزئیات رکورد" onBack />
        <div className="page">
          <ErrorState
            title="رکورد پیدا نشد"
            description="این رکورد حذف شده یا آدرس اشتباه است."
            action={
              <Button variant="secondary" onClick={() => navigate("/costs")}>
                بازگشت به فهرست
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const isIncome = cost.type === "INCOME";

  const confirmDelete = () => {
    store.deleteCost(cost.id);
    setDeleteOpen(false);
    showToast({ variant: "success", title: "رکورد حذف شد" });
    navigate("/costs", { replace: true });
  };

  return (
    <>
      <PageHeader
        title={isIncome ? "جزئیات درآمد" : "جزئیات هزینه"}
        subtitle={cost.title}
        onBack
        actions={
          <IconButton label="گزینه‌های بیشتر" onClick={() => setMenuOpen(true)}>
            <MoreVertical size={20} aria-hidden />
          </IconButton>
        }
      />

      <div className="page">
        {/* نمای کلی مبلغ */}
        <div className="ch-hero">
          <div className="ch-hero__row">
            <span className="ch-hero__label">
              <Badge tone={isIncome ? "success" : "error"}>
                {isIncome ? (
                  <>
                    <ArrowUpRight size={13} aria-hidden /> درآمد
                  </>
                ) : (
                  <>
                    <ArrowDownLeft size={13} aria-hidden /> هزینه
                  </>
                )}
              </Badge>
            </span>
          </div>
          <p className="ch-hero__amount">{faToman(cost.amount)}</p>
          <p className="ch-hero__note">
            {faDateLong(cost.date)} · ساعت {toFaDigits(cost.time)} ·{" "}
            {relativeFaDate(cost.date)}
          </p>
        </div>

        {/* مشخصات */}
        <section className="page__section" aria-label="مشخصات">
          <div className="section-head">
            <h2>مشخصات</h2>
          </div>
          <div className="spec-list">
            <div className="spec-list__row">
              <span className="spec-list__label">عنوان</span>
              <span className="spec-list__value">{cost.title}</span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">نوع</span>
              <span className="spec-list__value">
                {isIncome ? "درآمد" : "هزینه"}
              </span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">دسته‌بندی</span>
              <span className="spec-list__value">
                {category?.name ?? <span className="spec-list__empty">حذف‌شده</span>}
              </span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">تاریخ و ساعت</span>
              <span className="spec-list__value">
                {faDateLong(cost.date)} · ساعت {toFaDigits(cost.time)}
              </span>
            </div>
          </div>
        </section>

        {/* توضیحات */}
        {cost.description && (
          <section className="page__section" aria-label="توضیحات">
            <div className="section-head">
              <h2>توضیحات</h2>
            </div>
            <p className="detail-description">{cost.description}</p>
          </section>
        )}

        {/* پیوست */}
        {cost.attachment && (
          <section className="page__section" aria-label="پیوست">
            <div className="section-head">
              <h2>پیوست</h2>
            </div>
            <div className="attachment__preview">
              {cost.attachment.kind === "image" && cost.attachment.dataUrl ? (
                <img
                  src={cost.attachment.dataUrl}
                  alt={cost.attachment.name}
                  className="attachment__thumb"
                />
              ) : null}
              <div className="attachment__meta">
                <span className="attachment__name">{cost.attachment.name}</span>
                <span className="attachment__caption">ذخیره روی همین دستگاه</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* برگهٔ گزینه‌ها */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="گزینه‌ها">
        <div className="list">
          <ListItem
            icon={<Pencil size={18} aria-hidden />}
            title="ویرایش"
            onClick={() => {
              setMenuOpen(false);
              navigate(`/costs/add?id=${cost.id}`);
            }}
          />
          <ListItem
            icon={<Trash2 size={18} aria-hidden />}
            title="حذف رکورد"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          />
        </div>
      </BottomSheet>

      {/* تأیید حذف */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="حذف رکورد؟"
        description={`«${cost.title}» به مبلغ ${faToman(cost.amount)} حذف می‌شود. این عمل قابل بازگشت نیست و اثری بر ماندهٔ اشخاص یا فاکتورها ندارد.`}
        footer={
          <>
            <Button variant="destructive" onClick={confirmDelete}>
              حذف رکورد
            </Button>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              انصراف
            </Button>
          </>
        }
      />
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  BellRing,
  FileText,
  MoreVertical,
  Pencil,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Badge, StatusBadge } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, ErrorState, Skeleton } from "@/components/ui/Feedback";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { ListItem } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { useChequeStore } from "@/cheques/store";
import { useBookStore } from "@/book/store";
import { useInvoiceStore } from "@/invoices/store";
import type { ChequeStatus } from "@/cheques/types";
import {
  CHEQUE_STATUS_LABEL,
  CHEQUE_STATUS_TONE,
  CHEQUE_TYPE_LABEL,
  allowedTransitions,
  transitionImpactText,
} from "@/cheques/helpers";
import { CHEQUE_STATUS_ICON } from "./ChequeListPage";
import { faInvoiceNumber, outstandingAmount } from "@/invoices/helpers";
import { faToman, toFaDigits } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";

export function ChequeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const chequeStore = useChequeStore();
  const { persons } = useBookStore();
  const invoiceStore = useInvoiceStore();

  const cheque = id ? chequeStore.getCheque(id) : undefined;
  const party = persons.find((p) => p.id === cheque?.personId);
  const invoice = cheque?.invoiceId
    ? invoiceStore.getInvoice(cheque.invoiceId)
    : undefined;
  const reminder = cheque
    ? chequeStore.reminders.find((r) => r.id === cheque.reminderId)
    : undefined;

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, [id]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<ChequeStatus | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const transitions = useMemo(
    () => (cheque ? allowedTransitions(cheque.status) : []),
    [cheque]
  );

  if (loading) {
    return (
      <>
        <PageHeader title="…" onBack />
        <div className="page">
          <div role="status" aria-label="در حال بارگذاری چک">
            <Skeleton height={120} width="100%" />
            <Skeleton height={220} width="100%" className="mt-4" />
          </div>
        </div>
      </>
    );
  }

  if (!cheque) {
    return (
      <>
        <PageHeader title="جزئیات چک" onBack />
        <div className="page">
          <ErrorState
            title="چک پیدا نشد"
            description="ممکن است این چک حذف شده باشد."
            action={
              <Button onClick={() => navigate("/cheque/list")}>
                بازگشت به فهرست چک‌ها
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const invoiceRemaining = invoice
    ? Math.max(0, outstandingAmount(invoice) - chequeStore.settledByCheques(invoice.id))
    : 0;

  const doChangeStatus = () => {
    if (!pendingTarget) return;
    const result = chequeStore.changeStatus(cheque.id, pendingTarget);
    setPendingTarget(null);
    if (!result.ok) {
      showToast({ variant: "error", title: "تغییر وضعیت ناموفق بود", description: result.error });
      return;
    }
    showToast({
      variant: "success",
      title: `وضعیت به «${CHEQUE_STATUS_LABEL[pendingTarget]}» تغییر کرد`,
      description: "محاسبات مالی بر اساس وضعیت جدید به‌روزرسانی شد.",
    });
  };

  const doDelete = () => {
    chequeStore.deleteCheque(cheque.id);
    setDeleteOpen(false);
    showToast({
      variant: "success",
      title: "چک حذف شد",
      description: "اثر مالی چک نیز بازگشت داده شد.",
    });
    navigate("/cheque/list");
  };

  return (
    <>
      <PageHeader
        title={`چک ${CHEQUE_TYPE_LABEL[cheque.type]}`}
        subtitle={cheque.bank ?? "ثبت چک"}
        onBack
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil size={16} aria-hidden />}
              onClick={() => navigate(`/cheque/add?id=${cheque.id}`)}
            >
              ویرایش
            </Button>
            <IconButton label="گزینه‌های بیشتر" tone="filled" onClick={() => setMenuOpen(true)}>
              <MoreVertical size={20} aria-hidden />
            </IconButton>
          </>
        }
      />

      <div className="page">
        {/* مبلغ و وضعیت */}
        <div className="ch-hero">
          <div className="ch-hero__row">
            <span className="ch-hero__label">مبلغ چک</span>
            <StatusBadge
              tone={CHEQUE_STATUS_TONE[cheque.status]}
              icon={CHEQUE_STATUS_ICON[cheque.status]}
            >
              {CHEQUE_STATUS_LABEL[cheque.status]}
            </StatusBadge>
          </div>
          <p className="ch-hero__amount">{faToman(cheque.amount)}</p>
          {cheque.status !== "RECEIVED" && (
            <p className="ch-hero__note">
              تا وصول چک، هیچ اثر تسویه‌ای در محاسبات حساب اعمال نمی‌شود.
            </p>
          )}
          <Button
            block
            className="mt-3"
            icon={<RefreshCcw size={18} aria-hidden />}
            onClick={() => setStatusSheetOpen(true)}
            disabled={transitions.length === 0}
          >
            تغییر وضعیت
          </Button>
        </div>

        {/* مشخصات */}
        <section className="page__section" aria-label="مشخصات چک">
          <div className="section-head">
            <h2>مشخصات</h2>
          </div>
          <div className="spec-list">
            <div className="spec-list__row">
              <span className="spec-list__label">تاریخ سررسید</span>
              <span className="spec-list__value">{faDateLong(cheque.dueDate)}</span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">شمارهٔ صیادی</span>
              <span className="spec-list__value">
                {cheque.sayadiNumber ? (
                  <span dir="ltr" className="spec-list__ltr">
                    {toFaDigits(cheque.sayadiNumber)}
                  </span>
                ) : (
                  <span className="spec-list__empty">ثبت نشده</span>
                )}
              </span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">بانک</span>
              <span className="spec-list__value">
                {cheque.bank ?? <span className="spec-list__empty">ثبت نشده</span>}
              </span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">طرف حساب</span>
              <span className="spec-list__value">{party?.name ?? "—"}</span>
            </div>
            <div className="spec-list__row">
              <span className="spec-list__label">منبع مالی</span>
              <span className="spec-list__value">
                <Badge tone={cheque.sourceType === "INVOICE" ? "primary" : "info"}>
                  {cheque.sourceType === "INVOICE" ? "فاکتور" : "دفتر حساب"}
                </Badge>
              </span>
            </div>
            {cheque.description && (
              <div className="spec-list__row">
                <span className="spec-list__label">توضیحات</span>
                <span className="spec-list__value">{cheque.description}</span>
              </div>
            )}
          </div>
        </section>

        {/* یادآور سررسید */}
        {reminder && (
          <section className="page__section" aria-label="یادآور سررسید">
            <div className="ch-reminder">
              <BellRing size={18} aria-hidden />
              <div>
                <p className="ch-reminder__title">{reminder.title}</p>
                <p className="ch-reminder__desc">
                  {faDateLong(reminder.date)}
                  {reminder.description ? ` · ${reminder.description}` : ""}
                </p>
                <p className="ch-reminder__note">یادآور محلی — بدون اعلان (پوش نوتیفیکیشن)</p>
              </div>
            </div>
          </section>
        )}

        {/* فاکتور مرتبط */}
        {invoice && (
          <section className="page__section" aria-label="فاکتور مرتبط">
            <div className="section-head">
              <h2>فاکتور مرتبط</h2>
            </div>
            <div className="spec-list">
              <div className="spec-list__row">
                <span className="spec-list__label">شمارهٔ فاکتور</span>
                <span className="spec-list__value" dir="ltr">
                  {faInvoiceNumber(invoice.invoiceNumber)}
                </span>
              </div>
              <div className="spec-list__row">
                <span className="spec-list__label">مبلغ فاکتور</span>
                <span className="spec-list__value">{faToman(invoice.totalAmount)}</span>
              </div>
              <div className="spec-list__row">
                <span className="spec-list__label">ماندهٔ تسویه فاکتور</span>
                <span className="spec-list__value">
                  {invoiceRemaining > 0 ? faToman(invoiceRemaining) : "تسویه‌شده"}
                </span>
              </div>
            </div>
            <Button
              block
              variant="secondary"
              className="mt-3"
              icon={<FileText size={18} aria-hidden />}
              onClick={() => navigate(`/invoices/invoice/${invoice.id}`)}
            >
              مشاهده فاکتور
            </Button>
          </section>
        )}

        {/* پیوست */}
        {cheque.attachment && (
          <section className="page__section" aria-label="پیوست">
            <div className="section-head">
              <h2>پیوست</h2>
            </div>
            <div className="attachment__preview">
              {cheque.attachment.kind === "image" && cheque.attachment.dataUrl ? (
                <img
                  src={cheque.attachment.dataUrl}
                  alt={cheque.attachment.name}
                  className="attachment__thumb"
                />
              ) : null}
              <div className="attachment__meta">
                <span className="attachment__name">{cheque.attachment.name}</span>
                <span className="attachment__caption">ذخیره روی همین دستگاه</span>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* برگهٔ تغییر وضعیت */}
      <BottomSheet
        open={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        title="تغییر وضعیت چک"
      >
        <div className="list">
          {transitions.map((target) => (
            <ListItem
              key={target}
              icon={CHEQUE_STATUS_ICON[target]}
              title={CHEQUE_STATUS_LABEL[target]}
              caption={target === "RECEIVED" ? "اثر تسویه اعمال می‌شود" : "بدون اثر تسویه"}
              onClick={() => {
                setStatusSheetOpen(false);
                setPendingTarget(target);
              }}
            />
          ))}
        </div>
      </BottomSheet>

      {/* تأیید تغییر وضعیت */}
      <Modal
        open={pendingTarget !== null}
        onClose={() => setPendingTarget(null)}
        title={pendingTarget ? `تغییر وضعیت به «${CHEQUE_STATUS_LABEL[pendingTarget]}»؟` : ""}
        description={pendingTarget ? transitionImpactText(cheque, pendingTarget) : ""}
        footer={
          <>
            <Button onClick={doChangeStatus}>تأیید تغییر</Button>
            <Button variant="ghost" onClick={() => setPendingTarget(null)}>
              انصراف
            </Button>
          </>
        }
      />

      {/* منوی بیشتر */}
      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="گزینه‌ها"
      >
        <div className="list">
          <ListItem
            icon={<Pencil size={20} aria-hidden />}
            title="ویرایش"
            onClick={() => {
              setMenuOpen(false);
              navigate(`/cheque/add?id=${cheque.id}`);
            }}
          />
          <ListItem
            icon={<RefreshCcw size={20} aria-hidden />}
            title="تغییر وضعیت"
            onClick={() => {
              setMenuOpen(false);
              setStatusSheetOpen(true);
            }}
          />
          <ListItem
            icon={<Trash2 size={20} aria-hidden />}
            title="حذف چک"
            className="danger-row"
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
        title="حذف چک؟"
        description="این چک حذف می‌شود و این عمل قابل بازگشت نیست."
        footer={
          <>
            <Button variant="destructive" onClick={doDelete}>
              حذف چک
            </Button>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              انصراف
            </Button>
          </>
        }
      >
        {cheque.invoiceId ? (
          <Alert
            variant="warning"
            title="این چک به فاکتور متصل است"
            description="حذف این چک روی وضعیت تسویه فاکتور اثر می‌گذارد و فاکتور دوباره تسویه‌نشده محاسبه می‌شود."
          />
        ) : (
          <Alert
            variant="warning"
            title="اثر مالی چک بازگشت داده می‌شود"
            description="رکوردهای مالی متصل به این چک از دفتر حساب حذف می‌شوند."
          />
        )}
      </Modal>
    </>
  );
}

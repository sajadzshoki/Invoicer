import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Copy,
  FileOutput,
  MoreVertical,
  Pencil,
  Phone,
  Printer,
  ScrollText,
  Share2,
  Trash2,
  Truck,
} from "lucide-react";
import { PageHeader } from "@/app/PageHeader";
import { Badge, ListItem, StatusBadge } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";
import { Alert, ErrorState } from "@/components/ui/Feedback";
import { BottomSheet, Modal } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { useInvoiceStore } from "@/invoices/store";
import { useChequeStore } from "@/cheques/store";
import { useBookStore } from "@/book/store";
import { useSettings } from "@/settings/store";
import {
  buildShareText,
  computeTotals,
  faInvoiceNumber,
  INVOICE_STATUS_LABEL,
  INVOICE_TYPE_LABEL,
  outstandingAmount,
  PAYMENT_TYPE_LABEL,
  SHIPPING_LABEL,
} from "@/invoices/helpers";
import { faMoney, faNum, faToman, toFaDigits } from "@/lib/fa";
import { faDateLong } from "@/lib/jalali";
import { cn } from "@/lib/cn";

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const invoiceStore = useInvoiceStore();
  const chequeStore = useChequeStore();
  const { persons } = useBookStore();
  const { settings } = useSettings();
  const business = settings.business;
  const appearance = settings.invoice.appearance;

  const invoice = id ? invoiceStore.getInvoice(id) : undefined;
  const party = persons.find((p) => p.id === invoice?.personId);
  const invoiceCheques = invoice
    ? chequeStore.invoiceCheques(invoice.id)
    : [];

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const totals = useMemo(() => {
    if (!invoice) return null;
    return computeTotals({
      grossTotal: invoice.grossTotal,
      itemsDiscount: invoice.itemsDiscount,
      discount: invoice.discount,
      taxEnabled: invoice.taxEnabled,
      taxRate: invoice.taxRate,
      extraCostsTotal: invoice.extraCosts.reduce((s, ec) => s + ec.amount, 0),
    });
  }, [invoice]);

  if (!invoice || !totals) {
    return (
      <>
        <PageHeader title="جزئیات فاکتور" onBack />
        <div className="page">
          <ErrorState
            title="فاکتور پیدا نشد"
            description="ممکن است این فاکتور حذف شده باشد."
            action={
              <Button onClick={() => navigate("/invoices/invoice/list")}>
                بازگشت به فهرست
              </Button>
            }
          />
        </div>
      </>
    );
  }

  /* ماندهٔ آگاه از چک: برای فاکتورهای چکی، مبالغ وصول‌شدهٔ چک‌ها کسر می‌شود */
  const chequeSettled = chequeStore.settledByCheques(invoice.id);
  const outstanding =
    invoice.paymentType === "CHEQUE"
      ? Math.max(0, invoice.totalAmount - chequeSettled)
      : outstandingAmount(invoice);
  const chequeFullySettled =
    invoice.paymentType === "CHEQUE" && invoice.status === "CHEQUE_PENDING" && outstanding === 0;

  const doPrint = () => {
    setMenuOpen(false);
    window.print();
  };

  const doShare = async () => {
    setMenuOpen(false);
    const text = buildShareText(invoice, party?.name ?? "—", business.name);
    try {
      if (navigator.share) {
        await navigator.share({ title: `فاکتور ${invoice.invoiceNumber}`, text });
        return;
      }
      throw new Error("no-web-share");
    } catch (err) {
      // کاربر اشتراک‌گذاری را لغو کرد
      if (err instanceof Error && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(text);
        showToast({
          variant: "success",
          title: "متن فاکتور کپی شد",
          description: "در این مرورگر اشتراک‌گذاری مستقیم در دسترس نیست؛ متن برای ارسال کپی شد.",
        });
      } catch {
        showToast({
          variant: "warning",
          title: "اشتراک‌گذاری در دسترس نیست",
          description: "می‌توانید از گزینهٔ چاپ یا کپی دستی استفاده کنید.",
        });
      }
    }
  };

  const doCopy = () => {
    setMenuOpen(false);
    const copy = invoiceStore.copyInvoice(invoice.id);
    if (!copy) {
      showToast({ variant: "error", title: "کپی فاکتور ناموفق بود" });
      return;
    }
    showToast({
      variant: "success",
      title: "پیش‌فاکتور جدید ساخته شد",
      description: `کپی فاکتور با شمارهٔ ${faInvoiceNumber(copy.invoiceNumber)} ذخیره شد.`,
    });
    navigate(`/invoices/add?id=${copy.id}`);
  };

  const doDelete = () => {
    invoiceStore.deleteInvoice(invoice.id);
    setDeleteOpen(false);
    showToast({
      variant: "success",
      title: "فاکتور حذف شد",
      description: "اثر انباری و مالی فاکتور نیز بازگشت داده شد.",
    });
    navigate("/invoices/invoice/list");
  };

  const convertToSell = () => navigate(`/invoices/add?id=${invoice.id}&convert=sell`);

  return (
    <>
      <PageHeader
        title={`فاکتور ${INVOICE_TYPE_LABEL[invoice.type]}`}
        subtitle={faInvoiceNumber(invoice.invoiceNumber)}
        onBack
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil size={16} aria-hidden />}
              onClick={() => navigate(`/invoices/add?id=${invoice.id}`)}
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
        {/* اقدام ویژه برای پیش‌فاکتور و چک */}
        {invoice.type === "DRAFT" && (
          <div className="mb-4">
            <Button block size="lg" icon={<FileOutput size={20} aria-hidden />} onClick={convertToSell}>
              تبدیل به فاکتور فروش
            </Button>
            <p className="inv-muted mt-2">
              با تبدیل، اثر انباری و مالی فاکتور فروش یک‌بار اعمال می‌شود.
            </p>
          </div>
        )}
        {invoice.paymentType === "CHEQUE" && invoice.type !== "DRAFT" && (
          <Alert
            variant={chequeFullySettled ? "success" : "warning"}
            title={
              chequeFullySettled
                ? "تسویهٔ این فاکتور با چک کامل شد"
                : invoiceCheques.length > 0
                  ? "در انتظار وصول چک‌ها"
                  : "در انتظار تسویهٔ چک"
            }
            description={
              invoiceCheques.length > 0
                ? `${faNum(invoiceCheques.length)} چک برای این فاکتور ثبت شده است. فقط چک‌های «وصول شده» در تسویه محاسبه می‌شوند.`
                : "اثر مالی این فاکتور پس از ثبت و تعیین وضعیت چک اعمال می‌شود."
            }
            className="mb-4"
          />
        )}

        {/* سند فاکتور — همین ناحیه چاپ می‌شود */}
        <div className="print-area">
          <div
            className={cn(
              "inv-doc",
              appearance.layout === "formal" && "inv-doc--formal"
            )}
          >
            {/* سربرگ فاکتور — از پروفایل کسب‌وکار (تنظیمات) خوانده می‌شود */}
            <div className="inv-doc__head">
              <div className="inv-doc__brand-col">
                {appearance.showLogo && business.logo && (
                  <img
                    src={business.logo}
                    alt={business.name || "لوگوی کسب‌وکار"}
                    className="inv-doc__logo"
                  />
                )}
                <div>
                  <p className="inv-doc__brand">
                    {business.name.trim() || "نسق"}
                  </p>
                  <h2 className="inv-doc__title">فاکتور {INVOICE_TYPE_LABEL[invoice.type]}</h2>
                </div>
              </div>
              <div className="inv-doc__meta">
                <span>شماره: <strong dir="ltr">{faInvoiceNumber(invoice.invoiceNumber)}</strong></span>
                <span>تاریخ: {faDateLong(invoice.date)}</span>
                <span>ساعت: {toFaDigits(invoice.time)}</span>
              </div>
            </div>

            {(appearance.showBusinessAddress && business.address) ||
            (appearance.showBusinessPhone && (business.phone || business.mobile)) ||
            business.economicCode ? (
              <div className="inv-doc__business">
                {appearance.showBusinessAddress && business.address && (
                  <span>
                    {business.address}
                    {business.postalCode ? ` · کد پستی: ${toFaDigits(business.postalCode)}` : ""}
                  </span>
                )}
                {appearance.showBusinessPhone && (business.phone || business.mobile) && (
                  <span dir="ltr">{business.phone || business.mobile}</span>
                )}
                {business.economicCode && (
                  <span>کد اقتصادی: {toFaDigits(business.economicCode)}</span>
                )}
              </div>
            ) : null}

            <div className="inv-doc__party">
              <div>
                <span className="inv-muted">طرف حساب</span>
                <p className="inv-doc__party-name">{party?.name ?? "—"}</p>
                {party?.phone && (
                  <p className="inv-doc__party-meta" dir="ltr">
                    <Phone size={13} aria-hidden /> {party.phone}
                  </p>
                )}
                {appearance.showCustomerAddress && party?.address && (
                  <p className="inv-doc__party-meta">{party.address}</p>
                )}
              </div>
              <div className="inv-doc__status">
                <StatusBadge
                  tone={
                    chequeFullySettled
                      ? "success"
                      : invoice.status === "PAID"
                        ? "success"
                        : invoice.status === "UNPAID"
                          ? "error"
                          : invoice.status === "PARTIAL"
                            ? "info"
                            : invoice.status === "CHEQUE_PENDING"
                              ? "warning"
                              : "neutral"
                  }
                >
                  {chequeFullySettled
                    ? "تسویه با چک"
                    : INVOICE_STATUS_LABEL[invoice.status]}
                </StatusBadge>
              </div>
            </div>

            {/* اقلام */}
            <div className="inv-items" role="table" aria-label="اقلام فاکتور">
              <div className="inv-items__head" role="row">
                <span role="columnheader">قلم</span>
                <span role="columnheader">تعداد</span>
                <span role="columnheader">قیمت واحد</span>
                <span role="columnheader">تخفیف</span>
                <span role="columnheader">جمع</span>
              </div>
              {invoice.items.map((item) => (
                <div className="inv-items__row" key={item.id} role="row">
                  <span className="inv-items__name">
                    {item.nameSnapshot}
                    {item.productType === "SERVICE" && (
                      <Badge tone="info">خدمت</Badge>
                    )}
                  </span>
                  <span>
                    {faNum(item.quantity)}
                    {item.unit ? ` ${item.unit}` : ""}
                  </span>
                  <span>{faMoney(item.unitPrice)}</span>
                  <span>{item.discount > 0 ? faMoney(item.discount) : "—"}</span>
                  <span className="inv-items__total">{faMoney(item.total)}</span>
                </div>
              ))}
            </div>

            {/* خلاصهٔ مالی */}
            <div className="inv-totals inv-totals--print">
              <div className="inv-totals__row">
                <span>جمع اقلام</span>
                <span>{faToman(totals.grossTotal)}</span>
              </div>
              {totals.itemsDiscount > 0 && (
                <div className="inv-totals__row inv-totals__row--minus">
                  <span>تخفیف اقلام</span>
                  <span>− {faToman(totals.itemsDiscount)}</span>
                </div>
              )}
              {totals.discount > 0 && (
                <div className="inv-totals__row inv-totals__row--minus">
                  <span>تخفیف کل فاکتور</span>
                  <span>− {faToman(totals.discount)}</span>
                </div>
              )}
              {(totals.totalDiscount > 0 || invoice.taxEnabled) && (
                <div className="inv-totals__row">
                  <span>
                    مبلغ پس از تخفیف{invoice.taxEnabled ? " (مشمول مالیات)" : ""}
                  </span>
                  <span>{faToman(totals.subtotal)}</span>
                </div>
              )}
              {invoice.taxEnabled && (
                <div className="inv-totals__row">
                  <span>مالیات بر ارزش افزوده ({faNum(invoice.taxRate)}٪)</span>
                  <span>{faToman(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.extraCosts.map((ec) => (
                <div className="inv-totals__row" key={ec.id}>
                  <span>{ec.title}</span>
                  <span>{faToman(ec.amount)}</span>
                </div>
              ))}
              <div className="inv-totals__grand">
                <span>مبلغ کل</span>
                <span>{faToman(invoice.totalAmount)}</span>
              </div>
            </div>

            {/* تسویه، ارسال و اطلاعات اختیاری — نمایش طبق تنظیمات ظاهر فاکتور */}
            <div className="inv-doc__foot">
              {appearance.showPaymentInfo && invoice.type !== "DRAFT" && (
                <div className="inv-doc__foot-block">
                  <span className="inv-muted">تسویه</span>
                  <p>
                    {PAYMENT_TYPE_LABEL[invoice.paymentType]}
                    {invoice.paymentType === "INSTALLMENT" && (
                      <>
                        {" "}— پرداخت‌شده: {faToman(invoice.paidAmount)} · باقی‌مانده:{" "}
                        {faToman(outstanding)}
                      </>
                    )}
                    {invoice.paymentType === "CASH" && " — پرداخت کامل"}
                    {invoice.paymentType === "CHEQUE" &&
                      (chequeFullySettled
                        ? " — تسویهٔ کامل با چک"
                        : invoiceCheques.length > 0
                          ? ` — تسویه‌شده با چک: ${faToman(chequeSettled)} · باقی‌مانده: ${faToman(outstanding)}`
                          : " — در انتظار ثبت چک")}
                  </p>
                </div>
              )}
              {invoice.shippingStatus && (
                <div className="inv-doc__foot-block">
                  <span className="inv-muted">وضعیت ارسال</span>
                  <p>
                    <Truck size={14} aria-hidden /> {SHIPPING_LABEL[invoice.shippingStatus]}
                  </p>
                </div>
              )}
              {invoice.description && (
                <div className="inv-doc__foot-block">
                  <span className="inv-muted">توضیحات</span>
                  <p>{invoice.description}</p>
                </div>
              )}
              {appearance.showNotes && invoice.note && (
                <div className="inv-doc__foot-block">
                  <span className="inv-muted">یادداشت</span>
                  <p>{invoice.note}</p>
                </div>
              )}
              {invoice.customerContact && (
                <div className="inv-doc__foot-block">
                  <span className="inv-muted">اطلاعات تماس مشتری</span>
                  <p>{invoice.customerContact}</p>
                </div>
              )}
              {invoice.signature && (
                <div className="inv-doc__foot-block">
                  <span className="inv-muted">امضا</span>
                  <p>{invoice.signature}</p>
                </div>
              )}
            </div>

            {appearance.showFooter && appearance.footerText.trim() && (
              <p className="inv-doc__footer-text">{appearance.footerText}</p>
            )}
          </div>
        </div>

        {/* خلاصهٔ وضعیت برای فاکتورهای تسویه‌نشده */}
        {outstanding > 0 && invoice.type !== "DRAFT" && (
          <div
            className={cn(
              "money-banner mt-4",
              invoice.type === "SELL" ? "money-banner--received" : "money-banner--paid"
            )}
            role="status"
          >
            <span className="money-banner__label">
              {invoice.paymentType === "CHEQUE"
                ? "مبلغ در انتظار تسویهٔ چک"
                : invoice.type === "SELL"
                  ? "ماندهٔ دریافتنی از این فاکتور"
                  : "ماندهٔ پرداختنی از این فاکتور"}
            </span>
            <span className="money-banner__amount">{faToman(outstanding)}</span>
          </div>
        )}
      </div>

      {/* منوی بیشتر */}
      <BottomSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={faInvoiceNumber(invoice.invoiceNumber)}
      >
        <div className="list">
          <ListItem
            icon={<Pencil size={20} aria-hidden />}
            title="ویرایش"
            onClick={() => {
              setMenuOpen(false);
              navigate(`/invoices/add?id=${invoice.id}`);
            }}
          />
          <ListItem icon={<Copy size={20} aria-hidden />} title="کپی فاکتور" onClick={doCopy} />
          {invoice.type === "DRAFT" && (
            <ListItem
              icon={<FileOutput size={20} aria-hidden />}
              title="تبدیل به فاکتور فروش"
              onClick={() => {
                setMenuOpen(false);
                convertToSell();
              }}
            />
          )}
          {invoice.paymentType === "CHEQUE" && invoice.type !== "DRAFT" && (
            <ListItem
              icon={<ScrollText size={20} aria-hidden />}
              title="ثبت چک"
              onClick={() => {
                setMenuOpen(false);
                navigate(`/cheque/add/${invoice.id}`);
              }}
            />
          )}
          <ListItem icon={<Printer size={20} aria-hidden />} title="چاپ" onClick={doPrint} />
          <ListItem icon={<Share2 size={20} aria-hidden />} title="اشتراک‌گذاری" onClick={doShare} />
          <ListItem
            icon={<Trash2 size={20} aria-hidden />}
            title="حذف فاکتور"
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
        title="حذف فاکتور؟"
        description={
          invoiceCheques.length > 0
            ? "این فاکتور به چک متصل است و تا حذف‌نشدن چک‌ها نمی‌توان آن را حذف کرد."
            : `فاکتور ${faInvoiceNumber(invoice.invoiceNumber)} حذف می‌شود و این عمل قابل بازگشت نیست.`
        }
        footer={
          invoiceCheques.length > 0 ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleteOpen(false);
                  navigate(`/cheque/${invoiceCheques[0].id}`);
                }}
              >
                مشاهدهٔ چک‌ها
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                انصراف
              </Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={doDelete}>
                حذف فاکتور
              </Button>
              <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
                انصراف
              </Button>
            </>
          )
        }
      >
        {invoiceCheques.length > 0 ? (
          <Alert
            variant="warning"
            title="حذف فاکتور دارای چک مجاز نیست"
            description={`${faNum(invoiceCheques.length)} چک به این فاکتور متصل است. برای حذف فاکتور، ابتدا چک‌های آن را از صفحهٔ چک‌ها حذف کنید تا اثر مالی‌شان بازنویسی نشود.`}
          />
        ) : (
          invoice.type !== "DRAFT" && (
            <Alert
              variant="warning"
              title="اثر فاکتور نیز بازگشت داده می‌شود"
              description="حرکت‌های انباری و رکوردهای مالی متصل به این فاکتور حذف می‌شوند تا موجودی و ماندهٔ طرف حساب درست باقی بماند."
            />
          )
        )}
      </Modal>
    </>
  );
}

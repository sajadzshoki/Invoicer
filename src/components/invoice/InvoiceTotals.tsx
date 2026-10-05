import type { TotalsResult } from "@/invoices/helpers";
import { faNum, faToman } from "@/lib/fa";

export interface InvoiceTotalsProps {
  totals: TotalsResult;
  extraCosts: Array<{ title: string; amount: number }>;
  taxEnabled: boolean;
  taxRate: number;
}

/**
 * جدول خلاصهٔ مالی فاکتور — استفادهٔ مشترک در فرم و صفحهٔ جزئیات.
 * مبلغ کل همیشه غالب نمایش داده می‌شود.
 */
export function InvoiceTotals({
  totals,
  extraCosts,
  taxEnabled,
  taxRate,
}: InvoiceTotalsProps) {
  return (
    <div className="inv-totals">
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

      {(totals.totalDiscount > 0 || taxEnabled) && (
        <div className="inv-totals__row">
          <span>مبلغ پس از تخفیف{taxEnabled ? " (مشمول مالیات)" : ""}</span>
          <span>{faToman(totals.subtotal)}</span>
        </div>
      )}

      {taxEnabled && (
        <div className="inv-totals__row">
          <span>مالیات بر ارزش افزوده ({faNum(taxRate)}٪)</span>
          <span>{faToman(totals.taxAmount)}</span>
        </div>
      )}

      {extraCosts.map((ec, index) => (
        <div className="inv-totals__row" key={`${ec.title}-${index}`}>
          <span>{ec.title || "هزینهٔ اضافی"}</span>
          <span>{faToman(ec.amount)}</span>
        </div>
      ))}

      <div className="inv-totals__grand">
        <span>مبلغ کل</span>
        <span>{faToman(totals.totalAmount)}</span>
      </div>
    </div>
  );
}

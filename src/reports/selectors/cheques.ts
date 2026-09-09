import type { Cheque, ChequeStatus, ChequeType } from "@/cheques/types";
import { daysFromToday } from "@/reports/calculations/aggregate";
import { inRange, type ReportRange } from "@/reports/dateRange/range";
import { personName, type ReportDataSource } from "./dataSource";

/**
 * سلکتور گزارش چک‌ها (فاز ۶) — کاملاً خواندنی
 *
 * هیچ چک یا یادآوری از گزارش ساخته نمی‌شود؛ فقط نمایش وضعیت موجود.
 * بازهٔ گزارش روی «تاریخ سررسید» اعمال می‌شود.
 * چک‌ها مبلغ جداگانه‌ای به فروش/خرید اضافه نمی‌کنند — فقط وضعیت تسویه‌اند.
 */

export interface ChequeRow {
  cheque: Cheque;
  partyName: string;
  /** فاصلهٔ روز با امروز؛ مثبت = آینده، منفی = گذشته */
  daysToDue: number;
}

export interface ChequeStatusGroup {
  status: ChequeStatus;
  count: number;
  amount: number;
}

export interface ChequeReport {
  statusGroups: ChequeStatusGroup[];
  byType: Record<ChequeType, ChequeRow[]>;
  /** چک‌های در انتظار با نزدیک‌ترین سررسید (شامل گذشته) */
  upcoming: ChequeRow[];
  /** تعهدات پرداختی پیش رو — چک‌های پرداختی در انتظار وصول */
  upcomingPayments: ChequeRow[];
}

const STATUS_ORDER: ChequeStatus[] = [
  "PENDING",
  "RECEIVED",
  "RETURNED",
  "CANCELLED",
];

export function getChequeReport(
  data: ReportDataSource,
  range: ReportRange
): ChequeReport {
  const cheques = data.cheques.filter((c) => inRange(c.dueDate, range));

  const statusGroups: ChequeStatusGroup[] = STATUS_ORDER.map((status) => {
    const list = cheques.filter((c) => c.status === status);
    return {
      status,
      count: list.length,
      amount: list.reduce((s, c) => s + c.amount, 0),
    };
  });

  const toRows = (list: Cheque[]): ChequeRow[] =>
    list.map((cheque) => ({
      cheque,
      partyName: personName(data, cheque.personId),
      daysToDue: daysFromToday(cheque.dueDate),
    }));

  const byType = {
    RECEIVED: toRows(cheques.filter((c) => c.type === "RECEIVED")),
    PAID: toRows(cheques.filter((c) => c.type === "PAID")),
    TRANSFERRED: toRows(cheques.filter((c) => c.type === "TRANSFERRED")),
  } as Record<ChequeType, ChequeRow[]>;

  const upcoming = toRows(
    cheques
      .filter((c) => c.status === "PENDING")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  );

  const upcomingPayments = toRows(
    cheques
      .filter((c) => c.status === "PENDING" && c.type === "PAID")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  );

  return { statusGroups, byType, upcoming, upcomingPayments };
}

/** برچسب فارسی روزهای باقی‌مانده تا سررسید */
export function dueInLabel(days: number): string {
  const fa = (n: number) =>
    String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  if (days === 0) return "امروز";
  if (days > 0) return `${fa(days)} روز دیگر`;
  return `${fa(-days)} روز گذشته`;
}

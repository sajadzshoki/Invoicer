import type { BookAccountTransaction, Person } from "@/book/types";
import {
  computePartySummary,
  transactionEffect,
  TRANSACTION_TYPE_LABEL,
  type PartyFinanceSummary,
} from "@/book/finance";
import type { ReportDataSource } from "./dataSource";

/**
 * سلکتور طلب و بدهی (فاز ۶)
 *
 * مانده‌ها فقط از مدل دفتر حساب فاز ۲ مشتق می‌شوند؛ هیچ رکورد ماندهٔ
 * جدیدی ساخته نمی‌شود. اثر فاکتورها و چک‌ها از قبل در همین تراکنش‌هاست.
 * مانده‌ها «لحظه‌ای» هستند و بازهٔ تاریخ روی آن‌ها اعمال نمی‌شود.
 */

export interface PartyBalanceRow {
  person: Person;
  summary: PartyFinanceSummary;
}

export interface ReceivablesReport {
  receivableTotal: number;
  payableTotal: number;
  debtors: PartyBalanceRow[];
  creditors: PartyBalanceRow[];
  settledCount: number;
}

export function getReceivablesReport(data: ReportDataSource): ReceivablesReport {
  const debtors: PartyBalanceRow[] = [];
  const creditors: PartyBalanceRow[] = [];
  let receivableTotal = 0;
  let payableTotal = 0;
  let settledCount = 0;

  for (const person of data.persons) {
    const txs = data.transactions.filter((t) => t.personId === person.id);
    if (txs.length === 0) continue;
    const summary = computePartySummary(txs);
    if (summary.balance > 0) {
      debtors.push({ person, summary });
      receivableTotal += summary.balance;
    } else if (summary.balance < 0) {
      creditors.push({ person, summary });
      payableTotal += -summary.balance;
    } else {
      settledCount += 1;
    }
  }

  debtors.sort((a, b) => b.summary.balance - a.summary.balance);
  creditors.sort((a, b) => a.summary.balance - b.summary.balance);

  return { receivableTotal, payableTotal, debtors, creditors, settledCount };
}

/* ------------------------------ صورت‌حساب یک طرف حساب ------------------------------ */

export interface StatementRow {
  transaction: BookAccountTransaction;
  typeLabel: string;
  /** مثبت = بدهکارشدن طرف حساب، منفی = بستانکارشدن */
  effect: number;
  /** ماندهٔ در حال حرکت پس از این تراکنش (مثبت = طلب ما) */
  runningBalance: number;
}

export interface PartyStatementReport {
  person: Person | null;
  summary: PartyFinanceSummary;
  rows: StatementRow[];
}

/**
 * صورت‌حساب یک شخص — فقط از تراکنش‌های دفتر حساب.
 * اثر فاکتورها و چک‌ها از قبل داخل همین تراکنش‌ها ثبت شده است؛
 * پس هیچ جمع جداگانه‌ای اضافه نمی‌شود و شمارش مضاعفی در کار نیست.
 */
export function getPartyStatement(
  data: ReportDataSource,
  personId: string
): PartyStatementReport {
  const person = data.persons.find((p) => p.id === personId) ?? null;
  const txs = data.transactions
    .filter((t) => t.personId === personId)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)
    );

  let running = 0;
  const rows: StatementRow[] = txs.map((t) => {
    const effect = transactionEffect(t);
    running += effect;
    return {
      transaction: t,
      typeLabel: TRANSACTION_TYPE_LABEL[t.type],
      effect,
      runningBalance: running,
    };
  });

  return {
    person,
    summary: computePartySummary(txs),
    rows,
  };
}

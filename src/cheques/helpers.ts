import type {
  Cheque,
  ChequeSourceType,
  ChequeStatus,
  ChequeType,
} from "./types";

/* ------------------------------ برچسب‌ها ------------------------------ */

export const CHEQUE_TYPE_LABEL: Record<ChequeType, string> = {
  RECEIVED: "دریافتی",
  PAID: "پرداختی",
  TRANSFERRED: "خرج چک",
};

export const CHEQUE_STATUS_LABEL: Record<ChequeStatus, string> = {
  PENDING: "در انتظار وصول",
  RECEIVED: "وصول شده",
  RETURNED: "برگشت خورده",
  CANCELLED: "باطل شده",
};

export const CHEQUE_SOURCE_LABEL: Record<ChequeSourceType, string> = {
  INVOICE: "متصل به فاکتور",
  BOOKACCOUNT: "متصل به دفتر حساب",
};

export const CHEQUE_STATUS_TONE: Record<
  ChequeStatus,
  "warning" | "success" | "error" | "neutral"
> = {
  PENDING: "warning",
  RECEIVED: "success",
  RETURNED: "error",
  CANCELLED: "neutral",
};

/* ------------------------------ قوانین مالی ------------------------------ */

/**
 * آیا این چک در حال حاضر اثر تسویهٔ مالی دارد؟
 * فقط «وصول شده» و «خرج چک نبودن» اثر مالی ایجاد می‌کند.
 */
export function hasSettlementEffect(cheque: {
  status: ChequeStatus;
  type: ChequeType;
}): boolean {
  return cheque.status === "RECEIVED" && cheque.type !== "TRANSFERRED";
}

/* ------------------------------ گذار وضعیت ------------------------------ */

/** وضعیت‌های مجاز بعدی برای هر وضعیت فعلی */
const TRANSITIONS: Record<ChequeStatus, ChequeStatus[]> = {
  PENDING: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["RETURNED"],
  RETURNED: ["RECEIVED", "CANCELLED"],
  CANCELLED: ["PENDING"],
};

export function allowedTransitions(current: ChequeStatus): ChequeStatus[] {
  return TRANSITIONS[current];
}

/** توضیح اثر مالی یک گذار — برای مودال تأیید */
export function transitionImpactText(
  cheque: Cheque,
  target: ChequeStatus
): string {
  const isInvoice = cheque.sourceType === "INVOICE";
  switch (target) {
    case "RECEIVED":
      return isInvoice
        ? "این تغییر باعث می‌شود مبلغ چک به‌عنوان تسویه‌شده در محاسبات فاکتور و ماندهٔ طرف حساب منظور شود."
        : "این تغییر باعث می‌شود مبلغ چک به‌عنوان تسویه‌شده در محاسبات حساب طرف حساب منظور شود.";
    case "RETURNED":
      return cheque.status === "RECEIVED"
        ? "اثر تسویه برداشته می‌شود و مبلغ دوباره به‌عنوان ماندهٔ تسویه‌نشده محاسبه می‌شود."
        : "چک برگشت خورده و مبلغ آن تسویه‌شده حساب نخواهد شد.";
    case "CANCELLED":
      return cheque.status === "RECEIVED"
        ? "اثر تسویه برداشته می‌شود و چک باطل‌شده دیگر در محاسبات حساب نمی‌آید."
        : "چک باطل می‌شود و هیچ اثر تسویه‌ای نخواهد داشت.";
    case "PENDING":
      return "چک دوباره در انتظار وصول قرار می‌گیرد و تا وصول اثر تسویه‌ای ندارد.";
  }
}

/* ------------------------------ شمارهٔ صیادی ------------------------------ */

/** شمارهٔ صیادی باید ۱۶ رقم باشد (در صورت واردشدن) */
export function isValidSayadi(raw: string): boolean {
  return /^\d{16}$/.test(raw);
}

/* ------------------------------ خلاصهٔ داشبورد ------------------------------ */

export interface ChequeSummary {
  pendingCount: number;
  pendingAmount: number;
  dueSoonCount: number;
  dueSoonAmount: number;
  receivedAmount: number;
  returnedCount: number;
  returnedAmount: number;
}

/** سررسیدهای نزدیک: چک‌های در انتظار وصول با سررسید تا ۷ روز آینده یا گذشته */
export function computeChequeSummary(
  cheques: Cheque[],
  todayIso: string
): ChequeSummary {
  const soonLimit = addDaysIso(todayIso, 7);
  let pendingCount = 0;
  let pendingAmount = 0;
  let dueSoonCount = 0;
  let dueSoonAmount = 0;
  let receivedAmount = 0;
  let returnedCount = 0;
  let returnedAmount = 0;

  for (const ch of cheques) {
    if (ch.status === "PENDING") {
      pendingCount += 1;
      pendingAmount += ch.amount;
      if (ch.dueDate <= soonLimit) {
        dueSoonCount += 1;
        dueSoonAmount += ch.amount;
      }
    } else if (ch.status === "RECEIVED") {
      receivedAmount += ch.amount;
    } else if (ch.status === "RETURNED") {
      returnedCount += 1;
      returnedAmount += ch.amount;
    }
  }

  return {
    pendingCount,
    pendingAmount,
    dueSoonCount,
    dueSoonAmount,
    receivedAmount,
    returnedCount,
    returnedAmount,
  };
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

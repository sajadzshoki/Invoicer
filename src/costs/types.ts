/**
 * مدل دادهٔ ماژول هزینه‌ها و درآمدها — registerCost (فاز ۵)
 *
 * مرزهای حسابداری — بسیار مهم:
 * این رکوردها هزینه/درآمد عمومی کسب‌وکار هستند؛ بدون طرف حساب، بدون
 * اتصال به فاکتور یا چک و بدون هیچ اثری بر ماندهٔ اشخاص. این مفهوم هرگز
 * با تراکنش‌های دفتر حساب (که به شخص تعلق دارند) ادغام نمی‌شود.
 */

export type RegisterCostType = "INCOME" | "EXPENSE";

export interface CostCategory {
  id: string;
  name: string;
  /** دسته‌های هزینه و درآمد جدا از هم مدیریت می‌شوند */
  kind: RegisterCostType;
  createdAt: string;
  updatedAt: string;
}

export interface CostAttachment {
  name: string;
  dataUrl?: string;
  kind: "image" | "file";
  size?: number;
}

export interface RegisterCost {
  id: string;
  type: RegisterCostType;
  title: string;
  categoryId: string;
  /** مبلغ به تومان */
  amount: number;
  /** تاریخ ISO میلادی (نمایش جلالی) */
  date: string;
  /** ساعت به‌صورت «ساعت:دقیقه» */
  time: string;
  description?: string;
  attachment?: CostAttachment;
  createdAt: string;
  updatedAt: string;
}

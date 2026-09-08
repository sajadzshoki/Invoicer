import type { ReactNode } from "react";
import {
  FileText,
  Home,
  LayoutGrid,
  Package,
  Users,
} from "lucide-react";

export interface NavDestination {
  id: string;
  path: string;
  label: string;
  icon: ReactNode;
}

/**
 * پنج مقصد اصلی اپلیکیشن.
 * ساختار ناوبری در موبایل (پایین صفحه) و دسکتاپ (سایدبار) یکسان است.
 */
export const NAV_DESTINATIONS: NavDestination[] = [
  { id: "home", path: "/", label: "خانه", icon: <Home size={24} aria-hidden /> },
  { id: "parties", path: "/bookAccount", label: "طرف حساب‌ها", icon: <Users size={24} aria-hidden /> },
  { id: "invoices", path: "/invoices", label: "فاکتورها", icon: <FileText size={24} aria-hidden /> },
  { id: "products", path: "/products", label: "کالاها", icon: <Package size={24} aria-hidden /> },
  { id: "more", path: "/more", label: "بیشتر", icon: <LayoutGrid size={24} aria-hidden /> },
];

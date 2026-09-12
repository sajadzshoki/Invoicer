import type { ReactNode } from "react";
import {
  Banknote,
  Boxes,
  Brush,
  Database,
  FileSignature,
  Info,
  Landmark,
  Percent,
  Settings,
  Store,
  Tag,
  Wallet,
} from "lucide-react";

/** یک قلم تنظیماتی — برای فهرست، جستجو و ناوبری مشترک است */
export interface SettingsEntry {
  id: string;
  title: string;
  caption: string;
  /** کلمه‌های کلیدی جستجو */
  keywords: string[];
  path: string;
  icon: ReactNode;
  group: "business" | "invoice" | "financial" | "data" | "app";
}

export const SETTINGS_GROUPS: { id: SettingsEntry["group"]; title: string }[] = [
  { id: "business", title: "کسب‌وکار" },
  { id: "invoice", title: "فاکتور" },
  { id: "financial", title: "مالی" },
  { id: "data", title: "داده‌ها" },
  { id: "app", title: "برنامه" },
];

/** همهٔ صفحه‌های تنظیمات — تنها فهرست رسمی مسیرها (بدون مسیر تکراری) */
export const SETTINGS_ENTRIES: SettingsEntry[] = [
  {
    id: "business",
    title: "اطلاعات کسب‌وکار",
    caption: "نام، لوگو و اطلاعات تماس در سربرگ فاکتور",
    keywords: ["کسب‌وکار", "لوگو", "آدرس", "تلفن", "مشخصات", "پروفایل", "کد اقتصادی"],
    path: "/settings/business",
    icon: <Store size={20} aria-hidden />,
    group: "business",
  },
  {
    id: "categories",
    title: "دسته‌بندی‌ها",
    caption: "دسته‌های کالا، هزینه و درآمد",
    keywords: ["دسته", "دسته‌بندی", "گروه کالا", "دسته هزینه", "دسته درآمد"],
    path: "/settings/categories",
    icon: <Tag size={20} aria-hidden />,
    group: "business",
  },
  {
    id: "invoice",
    title: "تنظیمات فاکتور",
    caption: "شماره‌گذاری، پیش‌فرض‌ها و روش‌های تسویه",
    keywords: ["فاکتور", "شماره فاکتور", "پیشوند", "شماره‌گذاری", "پیش‌فرض", "روش تسویه", "نقدی", "نسیه", "اقساط", "چک"],
    path: "/settings/invoice",
    icon: <FileSignature size={20} aria-hidden />,
    group: "invoice",
  },
  {
    id: "tax",
    title: "مالیات",
    caption: "فعال‌سازی و نرخ پیش‌فرض مالیات فاکتور جدید",
    keywords: ["مالیات", "ارزش افزوده", "درصد", "نرخ"],
    path: "/settings/tax",
    icon: <Percent size={20} aria-hidden />,
    group: "invoice",
  },
  {
    id: "invoice-appearance",
    title: "ظاهر فاکتور",
    caption: "چیدمان چاپ و بخش‌های نمایش داده‌شده",
    keywords: ["ظاهر فاکتور", "چاپ", "پانوشت", "چیدمان", "رسمی", "ساده"],
    path: "/settings/invoice/appearance",
    icon: <Brush size={20} aria-hidden />,
    group: "invoice",
  },
  {
    id: "financial",
    title: "مالی و نمایش مبالغ",
    caption: "واحد پول، ارقام، تاریخ و جداکنندهٔ هزارگان",
    keywords: ["واحد پول", "تومان", "ریال", "ارقام فارسی", "ارقام لاتین", "تاریخ", "جلالی", "میلادی", "هزارگان"],
    path: "/settings/financial",
    icon: <Wallet size={20} aria-hidden />,
    group: "financial",
  },
  {
    id: "inventory",
    title: "پیش‌فرض‌های انبار",
    caption: "واحد و نقطهٔ سفارش کالای جدید، هشدار موجودی",
    keywords: ["انبار", "موجودی", "واحد", "نقطه سفارش", "هشدار کمبود"],
    path: "/settings/inventory",
    icon: <Boxes size={20} aria-hidden />,
    group: "financial",
  },
  {
    id: "cheque",
    title: "تنظیمات چک",
    caption: "بانک پیش‌فرض و یادآور محلی سررسید",
    keywords: ["چک", "بانک", "یادآور", "سررسید"],
    path: "/settings/cheque",
    icon: <Landmark size={20} aria-hidden />,
    group: "financial",
  },
  {
    id: "data",
    title: "پشتیبان‌گیری و داده‌ها",
    caption: "خروجی، بازیابی و پاک‌سازی اطلاعات",
    keywords: ["پشتیبان", "بازیابی", "خروجی", "ایمپورت", "ریست", "پاک‌سازی", "داده نمونه"],
    path: "/settings/data",
    icon: <Database size={20} aria-hidden />,
    group: "data",
  },
  {
    id: "appearance",
    title: "ظاهر برنامه",
    caption: "تم روشن، تاریک یا سیستم و زبان",
    keywords: ["تم", "روشن", "تاریک", "سیستم", "زبان", "ظاهر"],
    path: "/settings/appearance",
    icon: <Settings size={20} aria-hidden />,
    group: "app",
  },
  {
    id: "about",
    title: "درباره نسق",
    caption: "نسخه، فاز جاری و شیوهٔ ذخیرهٔ داده‌ها",
    keywords: ["درباره", "نسخه", "اطلاعات برنامه"],
    path: "/settings/about",
    icon: <Info size={20} aria-hidden />,
    group: "app",
  },
  {
    id: "payments",
    title: "روش‌های تسویه",
    caption: "فعال/غیرفعال‌کردن روش‌ها برای فاکتور جدید",
    keywords: ["روش تسویه", "نقدی", "نسیه", "اقساط", "چک", "پرداخت"],
    path: "/settings/invoice",
    icon: <Banknote size={20} aria-hidden />,
    group: "invoice",
  },
];

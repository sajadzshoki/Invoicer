import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { BookProvider } from "@/book/store";
import { InventoryProvider } from "@/inventory/store";
import { AppShell } from "@/app/AppShell";
import { HomePage } from "@/pages/HomePage";
import { PartiesPage } from "@/pages/PartiesPage";
import { PartyFormPage } from "@/pages/PartyFormPage";
import { PartyDetailPage } from "@/pages/PartyDetailPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ProductFormPage } from "@/pages/ProductFormPage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";
import { MorePage } from "@/pages/MorePage";
import { DesignSystemPage } from "@/pages/DesignSystemPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BookProvider>
          <InventoryProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />

                  {/* ماژول طرف حساب‌ها (دفتر حساب) */}
                  <Route path="bookAccount" element={<PartiesPage />} />
                  <Route path="bookAccount/add-customer" element={<PartyFormPage />} />
                  <Route path="bookAccount/:id" element={<PartyDetailPage />} />
                  {/* سازگاری با مسیر قدیمی فاز ۱ */}
                  <Route path="parties" element={<Navigate to="/bookAccount" replace />} />

                  {/* ماژول کالاها و خدمات */}
                  <Route path="products" element={<ProductsPage />} />
                  <Route path="products/add" element={<ProductFormPage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />

                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="more" element={<MorePage />} />
                  <Route path="design-system" element={<DesignSystemPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </InventoryProvider>
        </BookProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { BookProvider } from "@/book/store";
import { InventoryProvider } from "@/inventory/store";
import { InvoiceProvider } from "@/invoices/store";
import { ChequeProvider } from "@/cheques/store";
import { CostProvider } from "@/costs/store";
import { AppShell } from "@/app/AppShell";
import { HomePage } from "@/pages/HomePage";
import { PartiesPage } from "@/pages/PartiesPage";
import { PartyFormPage } from "@/pages/PartyFormPage";
import { PartyDetailPage } from "@/pages/PartyDetailPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { InvoiceFormPage } from "@/pages/InvoiceFormPage";
import { InvoiceDetailPage } from "@/pages/InvoiceDetailPage";
import { ChequeListPage } from "@/cheques/ChequeListPage";
import { ChequeFormPage } from "@/cheques/ChequeFormPage";
import { ChequeDetailPage } from "@/cheques/ChequeDetailPage";
import { CostsPage } from "@/costs/CostsPage";
import { CostFormPage } from "@/costs/CostFormPage";
import { CostDetailPage } from "@/costs/CostDetailPage";
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
            <InvoiceProvider>
              <ChequeProvider>
                <CostProvider>
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

                    {/* ماژول فاکتورها (فاز ۴) */}
                    <Route path="invoices" element={<Navigate to="/invoices/invoice/list" replace />} />
                    <Route path="invoices/invoice/list" element={<InvoicesPage />} />
                    <Route path="invoices/add" element={<InvoiceFormPage />} />
                    <Route path="invoices/invoice/:id" element={<InvoiceDetailPage />} />

                    {/* ماژول چک‌ها (فاز ۵) */}
                    <Route path="cheque/list" element={<ChequeListPage />} />
                    <Route path="cheque/add" element={<ChequeFormPage />} />
                    <Route path="cheque/add/:invoiceId" element={<ChequeFormPage />} />
                    <Route path="cheque/:id" element={<ChequeDetailPage />} />

                    {/* ماژول هزینه‌ها و درآمدها (فاز ۵) */}
                    <Route path="costs" element={<CostsPage />} />
                    <Route path="costs/add" element={<CostFormPage />} />
                    <Route path="costs/:id" element={<CostDetailPage />} />

                    <Route path="more" element={<MorePage />} />
                    <Route path="design-system" element={<DesignSystemPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
                </CostProvider>
              </ChequeProvider>
            </InvoiceProvider>
          </InventoryProvider>
        </BookProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

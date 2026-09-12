import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { SettingsProvider } from "@/settings/store";
import { ToastProvider } from "@/components/ui/Toast";
import { BookProvider } from "@/book/store";
import { InventoryProvider } from "@/inventory/store";
import { InvoiceProvider } from "@/invoices/store";
import { ChequeProvider } from "@/cheques/store";
import { CostProvider } from "@/costs/store";
import { ReportRangeProvider } from "@/reports/dateRange/ReportRangeContext";
import { SettingsHomePage } from "@/settings/pages/SettingsHomePage";
import { BusinessSettingsPage } from "@/settings/pages/BusinessSettingsPage";
import { InvoiceSettingsPage } from "@/settings/pages/InvoiceSettingsPage";
import { InvoiceAppearancePage } from "@/settings/pages/InvoiceAppearancePage";
import { TaxSettingsPage } from "@/settings/pages/TaxSettingsPage";
import { FinancialSettingsPage } from "@/settings/pages/FinancialSettingsPage";
import { CategoriesPage } from "@/settings/pages/CategoriesPage";
import { InventorySettingsPage } from "@/settings/pages/InventorySettingsPage";
import { ChequeSettingsPage } from "@/settings/pages/ChequeSettingsPage";
import { DataSettingsPage } from "@/settings/pages/DataSettingsPage";
import { AppearanceSettingsPage } from "@/settings/pages/AppearanceSettingsPage";
import { AboutPage } from "@/settings/pages/AboutPage";
import { ReportsHomePage } from "@/reports/pages/ReportsHomePage";
import { SalesReportPage } from "@/reports/pages/SalesReportPage";
import { PurchasesReportPage } from "@/reports/pages/PurchasesReportPage";
import { ProfitLossPage } from "@/reports/pages/ProfitLossPage";
import { IncomeExpensePage } from "@/reports/pages/IncomeExpensePage";
import { ReceivablesPage } from "@/reports/pages/ReceivablesPage";
import { PartyStatementPage } from "@/reports/pages/PartyStatementPage";
import { InventoryReportPage } from "@/reports/pages/InventoryReportPage";
import { MovementsReportPage } from "@/reports/pages/MovementsReportPage";
import { ProductPerformancePage } from "@/reports/pages/ProductPerformancePage";
import { ChequeReportPage } from "@/reports/pages/ChequeReportPage";
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
    <SettingsProvider>
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

                    {/* ماژول گزارش‌ها (فاز ۶) — خواندنی و مشتق از داده‌های موجود */}
                    <Route
                      path="reports"
                      element={
                        <ReportRangeProvider>
                          <Outlet />
                        </ReportRangeProvider>
                      }
                    >
                      <Route index element={<ReportsHomePage />} />
                      <Route path="sales" element={<SalesReportPage />} />
                      <Route path="purchases" element={<PurchasesReportPage />} />
                      <Route path="profit-loss" element={<ProfitLossPage />} />
                      <Route path="income-expense" element={<IncomeExpensePage />} />
                      <Route path="receivables" element={<ReceivablesPage />} />
                      <Route path="party/:id" element={<PartyStatementPage />} />
                      <Route path="inventory" element={<InventoryReportPage />} />
                      <Route path="inventory/movements" element={<MovementsReportPage />} />
                      <Route path="products" element={<ProductPerformancePage />} />
                      <Route path="cheques" element={<ChequeReportPage />} />
                    </Route>

                    {/* ماژول تنظیمات (فاز ۷) */}
                    <Route path="settings" element={<SettingsHomePage />} />
                    <Route path="settings/business" element={<BusinessSettingsPage />} />
                    <Route path="settings/invoice" element={<InvoiceSettingsPage />} />
                    <Route
                      path="settings/invoice/appearance"
                      element={<InvoiceAppearancePage />}
                    />
                    <Route path="settings/tax" element={<TaxSettingsPage />} />
                    <Route path="settings/financial" element={<FinancialSettingsPage />} />
                    <Route path="settings/categories" element={<CategoriesPage />} />
                    <Route path="settings/inventory" element={<InventorySettingsPage />} />
                    <Route path="settings/cheque" element={<ChequeSettingsPage />} />
                    <Route path="settings/data" element={<DataSettingsPage />} />
                    <Route path="settings/appearance" element={<AppearanceSettingsPage />} />
                    <Route path="settings/about" element={<AboutPage />} />

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
    </SettingsProvider>
  );
}

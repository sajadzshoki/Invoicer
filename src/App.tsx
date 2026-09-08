import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/app/AppShell";
import { HomePage } from "@/pages/HomePage";
import { PartiesPage } from "@/pages/PartiesPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { MorePage } from "@/pages/MorePage";
import { DesignSystemPage } from "@/pages/DesignSystemPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="parties" element={<PartiesPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="more" element={<MorePage />} />
              <Route path="design-system" element={<DesignSystemPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

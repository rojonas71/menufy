import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppearancePage } from "./pages/AppearancePage";
import { CartProvider } from "./context/CartContext";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevAdminPage } from "./pages/DevAdminPage";
import { DevBusinessDetailsPage } from "./pages/DevBusinessDetailsPage";
import { LandingPage } from "./pages/LandingPage";
import { RootPage } from "./pages/RootPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { MenuPage } from "./pages/MenuPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProductsPage } from "./pages/ProductsPage";
import { QrCodePage } from "./pages/QrCodePage";
import { SuccessPage } from "./pages/SuccessPage";
import { DevAuditPage } from "./pages/DevAuditPage";
import { DevSettingsPage } from "./pages/DevSettingsPage";
import { OrdersPage } from "./pages/OrdersPage";

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <CartProvider>
          <Routes>
            <Route path="/" element={<RootPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<Navigate to="/esqueci-senha" replace />} />
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/categorias" element={<CategoriesPage />} />
            <Route path="/dashboard/produtos" element={<ProductsPage />} />
            <Route path="/dashboard/pedidos" element={<OrdersPage />} />
            <Route path="/dashboard/aparencia" element={<AppearancePage />} />
            <Route path="/dashboard/qrcode" element={<QrCodePage />} />

            <Route path="/dev" element={<DevAdminPage />} />
            <Route path="/dev/estabelecimentos/:id" element={<DevBusinessDetailsPage />} />
            <Route path="/dev/configuracoes" element={<DevSettingsPage />} />
            <Route path="/dev/auditoria" element={<DevAuditPage />} />

            <Route path="/menu/:slug" element={<MenuPage />} />
            <Route path="/menu/:slug/checkout" element={<CheckoutPage />} />
            <Route path="/menu/:slug/sucesso" element={<SuccessPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </CartProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

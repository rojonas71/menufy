import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppearancePage } from "./pages/AppearancePage";
import { CartProvider } from "./context/CartContext";
import { CategoriesPage } from "./pages/CategoriesPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { MenuPage } from "./pages/MenuPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProductsPage } from "./pages/ProductsPage";
import { QrCodePage } from "./pages/QrCodePage";
import { SuccessPage } from "./pages/SuccessPage";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/categorias" element={<CategoriesPage />} />
          <Route path="/dashboard/produtos" element={<ProductsPage />} />
          <Route path="/dashboard/aparencia" element={<AppearancePage />} />
          <Route path="/dashboard/qrcode" element={<QrCodePage />} />
          <Route path="/menu/:slug" element={<MenuPage />} />
          <Route path="/menu/:slug/checkout" element={<CheckoutPage />} />
          <Route path="/menu/:slug/sucesso" element={<SuccessPage />} />
          <Route path="/dev" element={<DevAdminPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

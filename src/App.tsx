import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { CartProvider } from "@/context/CartContext";
import { ProductsProvider } from "@/context/Products/ProductsContext";
import { OrdersProvider } from "@/context/Orders/OrdersContext";
import Layout from "@/components/layout/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailedPage from "./pages/PaymentFailedPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AboutPage from "./pages/AboutPage";
import DeliveryPage from "./pages/DeliveryPage";
import ContactPage from "./pages/ContactPage";
import ReviewsPage from "./pages/ReviewsPage";
import NotFound from "./pages/NotFound";
import WebsiteInDevelopmentPage from "./pages/WebsiteInDevelopmentPage.tsx";

// ── Portal ───────────────────────────────────────────────────────────────────
import PortalLayout from "@/portal/components/PortalLayout";
import LoginPage from "@/portal/pages/auth/LoginPage";
import RegisterPage from "@/portal/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/portal/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/portal/pages/auth/ResetPasswordPage";
import DashboardPage from "@/portal/pages/DashboardPage";
import PortalProductsPage from "@/portal/pages/ProductsPage";
import PortalCartPage from "@/portal/pages/CartPage";
import PortalCheckoutPage from "@/portal/pages/CheckoutPage";
import PortalOrderConfirmationPage from "@/portal/pages/PortalOrderConfirmationPage";
import OrdersPage from "@/portal/pages/OrdersPage";
import OrderDetailPage from "@/portal/pages/OrderDetailPage";
import SubscriptionsPage from "@/portal/pages/SubscriptionsPage";
import NewSubscriptionPage from "@/portal/pages/NewSubscriptionPage";
import SubscriptionDetailPage from "@/portal/pages/SubscriptionDetailPage";
import DeliveriesPage from "@/portal/pages/DeliveriesPage";
import PaymentsPage from "@/portal/pages/PaymentsPage";
import AddressesPage from "@/portal/pages/AddressesPage";
import SupportPage from "@/portal/pages/SupportPage";
import AccountSettingsPage from "@/portal/pages/AccountSettingsPage";
import NotificationsPage from "@/portal/pages/NotificationsPage";

const queryClient = new QueryClient();

const SITE_STATUS_ENDPOINT = "https://admin.litwebs.co.uk/api/websites/status";
const SITE_URL_TO_CHECK = "https://levantsdairy.co.uk";

const App = () => {
  const [checking, setChecking] = useState(true);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setChecking(false);
      return;
    }

    let mounted = true;

    const checkStatus = async () => {
      try {
        const res = await fetch(SITE_STATUS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: SITE_URL_TO_CHECK }),
        });

        if (!res.ok) return false;

        const json = await res.json();
        const status =
          json?.data?.data?.status ?? json?.data?.status ?? json?.status;
        return String(status).toLowerCase() === "live";
      } catch {
        return false;
      }
    };

    (async () => {
      const live = await checkStatus();
      if (!mounted) return;
      setIsLive(live);
      setChecking(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return null;
  }

  if (!isLive) {
    return (
      <BrowserRouter>
        <ScrollToTopButton />
        <Routes>
          <Route path="*" element={<WebsiteInDevelopmentPage />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <ProductsProvider>
          <OrdersProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <ScrollToTopButton />
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Layout>
                        <HomePage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/shop"
                    element={
                      <Layout>
                        <ShopPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/product/:id"
                    element={
                      <Layout>
                        <ProductPage />
                      </Layout>
                    }
                  />
                  {/* <Route
                    path="/cart"
                    element={
                      <Layout>
                        <CartPage />
                      </Layout>
                    }
                  /> */}
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route
                    path="/checkout/success"
                    element={
                      <Layout>
                        <PaymentSuccessPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/checkout/cancel"
                    element={
                      <Layout>
                        <PaymentFailedPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/order-confirmation"
                    element={<OrderConfirmationPage />}
                  />
                  <Route
                    path="/about"
                    element={
                      <Layout>
                        <AboutPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/delivery"
                    element={
                      <Layout>
                        <DeliveryPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <Layout>
                        <ContactPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/reviews"
                    element={
                      <Layout>
                        <ReviewsPage />
                      </Layout>
                    }
                  />
                  {/* ── Customer Portal ─────────────────────────────── */}
                  {/* Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordPage />}
                  />

                  {/* Portal pages (all wrapped in PortalLayout) */}
                  <Route
                    path="/portal/dashboard"
                    element={
                      <PortalLayout>
                        <DashboardPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/products"
                    element={
                      <PortalLayout>
                        <PortalProductsPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/cart"
                    element={
                      <PortalLayout>
                        <PortalCartPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/checkout"
                    element={
                      <PortalLayout>
                        <PortalCheckoutPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/order-confirmation"
                    element={
                      <PortalLayout>
                        <PortalOrderConfirmationPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/orders"
                    element={
                      <PortalLayout>
                        <OrdersPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/orders/:id"
                    element={
                      <PortalLayout>
                        <OrderDetailPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/subscriptions"
                    element={
                      <PortalLayout>
                        <SubscriptionsPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/subscriptions/new"
                    element={
                      <PortalLayout>
                        <NewSubscriptionPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/subscriptions/:id"
                    element={
                      <PortalLayout>
                        <SubscriptionDetailPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/deliveries"
                    element={
                      <PortalLayout>
                        <DeliveriesPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/payments"
                    element={
                      <PortalLayout>
                        <PaymentsPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/addresses"
                    element={
                      <PortalLayout>
                        <AddressesPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/support"
                    element={
                      <PortalLayout>
                        <SupportPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/account"
                    element={
                      <PortalLayout>
                        <AccountSettingsPage />
                      </PortalLayout>
                    }
                  />
                  <Route
                    path="/portal/notifications"
                    element={
                      <PortalLayout>
                        <NotificationsPage />
                      </PortalLayout>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </OrdersProvider>
        </ProductsProvider>
      </CartProvider>
    </QueryClientProvider>
  );
};

export default App;

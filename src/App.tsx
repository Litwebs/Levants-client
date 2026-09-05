import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { CartProvider } from "@/context/CartContext";
import { ProductsProvider } from "@/context/Products/ProductsContext";
import { OrdersProvider } from "@/context/Orders/OrdersContext";
import { BusinessInfoProvider } from "@/context/BusinessInfoContext";
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
import ConfirmEmailChangePage from "@/portal/pages/auth/ConfirmEmailChangePage";
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
import SubscriptionAddProductsPage from "@/portal/pages/SubscriptionAddProductsPage";
import SubscriptionDeliveryAddOnPage from "@/portal/pages/SubscriptionDeliveryAddOnPage";
import PaymentsPage from "@/portal/pages/PaymentsPage";
import AddressesPage from "@/portal/pages/AddressesPage";
import SupportPage from "@/portal/pages/SupportPage";
import AccountSettingsPage from "@/portal/pages/AccountSettingsPage";
import StoreCreditPage from "@/portal/pages/StoreCreditPage";
import NotificationsPage from "@/portal/pages/NotificationsPage";
import {
  PORTAL_AUTH_CHANGED_EVENT,
  isPortalLoggedIn,
  setPortalLoggedIn,
} from "@/lib/portalAuth";
import { portalAuthApi } from "@/api/portalAuth";

const queryClient = new QueryClient();

const SITE_STATUS_ENDPOINT = "https://admin.litwebs.co.uk/api/websites/status";
const SITE_URL_TO_CHECK = "https://levantsdairy.co.uk";

const App = () => {
  const [checking, setChecking] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [portalAuthReady, setPortalAuthReady] = useState(false);
  const [portalAuthenticated, setPortalAuthenticated] =
    useState(isPortalLoggedIn());

  useEffect(() => {
    let mounted = true;

    const syncAuthState = async () => {
      try {
        await portalAuthApi.me();
        if (!mounted) return;
        setPortalLoggedIn(true);
        setPortalAuthenticated(true);
      } catch {
        if (!mounted) return;
        setPortalLoggedIn(false);
        setPortalAuthenticated(false);
      } finally {
        if (mounted) setPortalAuthReady(true);
      }
    };

    void syncAuthState();

    const handleAuthChanged = () => {
      setPortalAuthenticated(isPortalLoggedIn());
    };

    window.addEventListener(PORTAL_AUTH_CHANGED_EVENT, handleAuthChanged);
    return () => {
      mounted = false;
      window.removeEventListener(PORTAL_AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, []);

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

  const RequirePortalAuth = ({ children }: { children: JSX.Element }) => {
    if (!portalAuthReady) return null;
    if (!portalAuthenticated) return <Navigate to="/login" replace />;
    return children;
  };

  const GuestOnlyRoute = ({ children }: { children: JSX.Element }) => {
    if (!portalAuthReady) return null;
    if (portalAuthenticated) return <Navigate to="/portal/dashboard" replace />;
    return children;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BusinessInfoProvider>
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
                  <Route
                    path="/portal"
                    element={
                      <Navigate
                        to={
                          portalAuthenticated ? "/portal/dashboard" : "/login"
                        }
                        replace
                      />
                    }
                  />
                  <Route
                    path="/login"
                    element={
                      <GuestOnlyRoute>
                        <Layout>
                          <LoginPage />
                        </Layout>
                      </GuestOnlyRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestOnlyRoute>
                        <Layout>
                          <RegisterPage />
                        </Layout>
                      </GuestOnlyRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <GuestOnlyRoute>
                        <ForgotPasswordPage />
                      </GuestOnlyRoute>
                    }
                  />
                  <Route
                    path="/reset-password"
                    element={
                      <GuestOnlyRoute>
                        <ResetPasswordPage />
                      </GuestOnlyRoute>
                    }
                  />
                  <Route
                    path="/portal/reset-password"
                    element={
                      <GuestOnlyRoute>
                        <ResetPasswordPage />
                      </GuestOnlyRoute>
                    }
                  />
                  <Route
                    path="/confirm-email-change"
                    element={<ConfirmEmailChangePage />}
                  />

                  {/* Portal pages (all wrapped in PortalLayout) */}
                  <Route
                    path="/portal/dashboard"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <DashboardPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/products"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <PortalProductsPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/cart"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <PortalCartPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/checkout"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <PortalCheckoutPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/order-confirmation"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <PortalOrderConfirmationPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/orders"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <OrdersPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/orders/:id"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <OrderDetailPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/subscriptions"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <SubscriptionsPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/subscriptions/new"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <NewSubscriptionPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/subscriptions/:id"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <SubscriptionDetailPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/subscriptions/:id/add-products"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <SubscriptionAddProductsPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/subscriptions/:id/next-delivery/add-ons"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <SubscriptionDeliveryAddOnPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/payments"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <PaymentsPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/addresses"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <AddressesPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/support"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <SupportPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/account"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <AccountSettingsPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/credit"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <StoreCreditPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />
                  <Route
                    path="/portal/notifications"
                    element={
                      <RequirePortalAuth>
                        <PortalLayout>
                          <NotificationsPage />
                        </PortalLayout>
                      </RequirePortalAuth>
                    }
                  />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
            </OrdersProvider>
          </ProductsProvider>
        </CartProvider>
      </BusinessInfoProvider>
    </QueryClientProvider>
  );
};

export default App;

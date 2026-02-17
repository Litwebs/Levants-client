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
import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailedPage from "./pages/PaymentFailedPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import AboutPage from "./pages/AboutPage";
import DeliveryPage from "./pages/DeliveryPage";
import ContactPage from "./pages/ContactPage";
import NotFound from "./pages/NotFound";
import WebsiteInDevelopmentPage from "./pages/WebsiteInDevelopmentPage.tsx";

const queryClient = new QueryClient();

const SITE_STATUS_ENDPOINT = "https://admin.litwebs.co.uk/api/websites/status";
const SITE_URL_TO_CHECK = "https://levantsdairy.co.uk";

const App = () => {
  const [checking, setChecking] = useState(true);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
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

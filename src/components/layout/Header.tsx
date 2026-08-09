import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, Sun, Moon, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import api from "@/api/client";
import { portalAuthApi, type PortalCustomer } from "@/api/portalAuth";
import { AnnouncementBanner } from "./AnnouncementBanner";
import { ORDER_DEADLINES_TEXT } from "@/lib/orderDeadlines";
import { PORTAL_AUTH_CHANGED_EVENT, isPortalLoggedIn } from "@/lib/portalAuth";
import { useBusinessInfo } from "@/context/BusinessInfoContext";

type ActiveDiscount = {
  code: string;
  kind: "percent" | "amount";
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  variants?: string[];
};

function readCustomerFromEnvelope(payload: unknown): PortalCustomer | null {
  if (!payload || typeof payload !== "object") return null;

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;

  const customerWrapper = (data as { customer?: unknown }).customer;
  if (customerWrapper && typeof customerWrapper === "object") {
    return customerWrapper as PortalCustomer;
  }

  return data as PortalCustomer;
}

interface HeaderProps {
  /** Extra actions rendered in the right-hand action group (e.g. portal theme toggle + account menu). */
  actions?: React.ReactNode;
  /** Hide the default account/login icon (used when `actions` already provides an account control). */
  showAccountLink?: boolean;
  /** When provided, the mobile menu button calls this instead of toggling the built-in nav drawer. */
  onMenuClick?: () => void;
  /** When provided, the cart button calls this instead of opening the cart drawer. */
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  actions,
  showAccountLink = true,
  onMenuClick,
  onCartClick,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [portalLoggedIn, setPortalLoggedIn] = useState(() =>
    isPortalLoggedIn(),
  );
  const [activeDiscount, setActiveDiscount] = useState<ActiveDiscount | null>(
    null,
  );
  const [customer, setCustomer] = useState<PortalCustomer | null>(null);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const { itemCount, openCart } = useCart();
  const businessInfo = useBusinessInfo();
  const location = useLocation();
  const showEnhancedAccount = !actions && portalLoggedIn;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get<{
          success: boolean;
          data?: { items?: ActiveDiscount[] };
        }>("/discounts/active");

        if (!isMounted) return;
        if (!res?.success) return;

        const items = Array.isArray(res.data?.items) ? res.data?.items : [];
        if (items.length === 0) {
          setActiveDiscount(null);
          return;
        }

        // Prefer sitewide discounts (no variants specified), else use the first one.
        const sitewide = items.find((d) => !d.variants?.length);
        setActiveDiscount(sitewide ?? items[0]);
      } catch {
        // Ignore banner errors; keep default message.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const syncPortalAuth = () => {
      setPortalLoggedIn(isPortalLoggedIn());
    };

    window.addEventListener("storage", syncPortalAuth);
    window.addEventListener(PORTAL_AUTH_CHANGED_EVENT, syncPortalAuth);

    return () => {
      window.removeEventListener("storage", syncPortalAuth);
      window.removeEventListener(PORTAL_AUTH_CHANGED_EVENT, syncPortalAuth);
    };
  }, []);

  useEffect(() => {
    if (!showEnhancedAccount) {
      setCustomer(null);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const res = await portalAuthApi.me();
        if (!active) return;

        const parsedCustomer = readCustomerFromEnvelope(res);
        if (!parsedCustomer) return;

        setCustomer(parsedCustomer);
        const pref = parsedCustomer.themePreference;
        if (pref === "dark" || pref === "light") {
          setIsDark(pref === "dark");
          document.documentElement.classList.toggle("dark", pref === "dark");
          localStorage.setItem("portal-theme", pref);
        }
      } catch {
        // Keep fallback UI if profile fetch fails.
      }
    })();

    return () => {
      active = false;
    };
  }, [showEnhancedAccount]);

  const handleThemeToggle = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    document.documentElement.classList.toggle("dark", nextIsDark);
    const themePreference = nextIsDark ? "dark" : "light";
    localStorage.setItem("portal-theme", themePreference);

    if (portalLoggedIn) {
      void portalAuthApi.updateProfile({ themePreference });
    }
  };

  const discountAnnouncement = useMemo(() => {
    if (!activeDiscount) return null;

    const code = String(activeDiscount.code || "").trim();
    const variants = Array.isArray(activeDiscount.variants)
      ? activeDiscount.variants.filter(Boolean)
      : [];

    const scopeText =
      variants.length > 0 ? `Applies to: ${variants.join(", ")}` : "Sitewide";

    if (activeDiscount.kind === "percent") {
      const percent = Number(activeDiscount.percentOff || 0);
      const percentText =
        Number.isFinite(percent) && percent > 0 ? `${percent}%` : "%";
      return { code, valueText: `${percentText}`, scopeText };
    }

    if (activeDiscount.kind === "amount") {
      const amount = Number(activeDiscount.amountOff || 0);
      const currency = String(activeDiscount.currency || "GBP").toUpperCase();
      const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
      const amountText =
        Number.isFinite(amount) && amount > 0 ? `${symbol}${amount}` : "Amount";
      return { code, valueText: `${amountText}`, scopeText };
    }

    return { code, valueText: "", scopeText };
  }, [activeDiscount]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Reviews", path: "/reviews" },
    { name: "About", path: "/about" },
    { name: "Delivery & FAQs", path: "/delivery" },
    { name: "Contact", path: "/contact" },
  ];

  const firstName = customer?.firstName?.trim() || "Account";
  const avatarInitials =
    `${customer?.firstName?.[0] || ""}${customer?.lastName?.[0] || ""}`.toUpperCase() ||
    "AC";

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBanner />
      <div
        className="announcement-bar font-semibold text-sm sm:text-base"
        role="status"
        aria-live="polite"
      >
        <div className="container-custom flex flex-col items-center justify-center gap-0.5 leading-tight">
          {discountAnnouncement && (
            <p className="text-center">
              <span aria-hidden>🏷️ </span>
              <span className="font-bold">Discount:</span>{" "}
              <span className="font-extrabold">
                {discountAnnouncement.code}
              </span>
              {discountAnnouncement.valueText ? (
                <>
                  {" • "}
                  <span>{discountAnnouncement.valueText} off</span>
                </>
              ) : null}
              {" • "}
              <span className="opacity-95">
                {discountAnnouncement.scopeText}
              </span>
            </p>
          )}

          <p className="text-center">{ORDER_DEADLINES_TEXT}</p>
        </div>
      </div>

      <div className="bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="lg:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
                onClick={onMenuClick ?? (() => setIsMenuOpen(!isMenuOpen))}
                aria-label="Toggle menu"
              >
                {!onMenuClick && isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              <Link to="/" className="flex items-center gap-2">
                <img
                  src={businessInfo.logoUrl}
                  alt={`${businessInfo.companyName} logo`}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <h1 className="hidden sm:block font-heading text-xl lg:text-2xl font-semibold text-primary max-w-48 lg:max-w-72 truncate">
                  {businessInfo.companyName}
                </h1>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors link-underline ${
                    isActive(link.path)
                      ? "text-primary"
                      : "text-foreground hover:text-primary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 lg:gap-4">
              {actions}

              {showEnhancedAccount && (
                <>
                  <button
                    onClick={handleThemeToggle}
                    className="p-2 text-foreground hover:text-primary transition-colors"
                    aria-label="Toggle theme"
                  >
                    {isDark ? (
                      <Sun className="w-5 h-5" />
                    ) : (
                      <Moon className="w-5 h-5" />
                    )}
                  </button>

                  <Link
                    to="/portal/dashboard"
                    className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-xl hover:bg-muted transition-colors text-sm"
                    aria-label="Open portal dashboard"
                  >
                    <div className="w-7 h-7 rounded-full bg-forest/15 flex items-center justify-center text-forest text-xs font-bold">
                      {avatarInitials}
                    </div>
                    <span className="hidden sm:block font-medium text-foreground">
                      {firstName}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                </>
              )}

              {showAccountLink && !showEnhancedAccount && (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    Sign up
                  </Link>
                </div>
              )}

              <button
                onClick={onCartClick ?? openCart}
                className="relative p-2 text-foreground hover:text-primary transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium rounded-full animate-bounce-subtle">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {!onMenuClick && isMenuOpen && (
          <div className="lg:hidden border-t border-border animate-fade-in">
            <nav className="container-custom py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.path)
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import api from "@/api/client";

type ActiveDiscount = {
  code: string;
  kind: "percent" | "amount";
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  variants?: string[];
};

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDiscount, setActiveDiscount] = useState<ActiveDiscount | null>(
    null,
  );
  const { itemCount, openCart } = useCart();
  const location = useLocation();

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

  const announcementText = useMemo(() => {
    if (!activeDiscount) return "";

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
      return `🏷️ Discount: ${code} • ${percentText} off • ${scopeText}`;
    }

    if (activeDiscount.kind === "amount") {
      const amount = Number(activeDiscount.amountOff || 0);
      const currency = String(activeDiscount.currency || "GBP").toUpperCase();
      const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
      const amountText =
        Number.isFinite(amount) && amount > 0 ? `${symbol}${amount}` : "Amount";
      return `🏷️ Discount: ${code} • ${amountText} off • ${scopeText}`;
    }

    return `🏷️ Discount: ${code} • ${scopeText}`;
  }, [activeDiscount]);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "Delivery & FAQs", path: "/delivery" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {activeDiscount && (
        <div className="announcement-bar">
          <p className="container-custom">{announcementText}</p>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <button
              className="lg:hidden p-2 -ml-2 text-foreground hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-2">
              <img
                src="/Logo.jpg"
                alt="Levants logo"
                className="w-7 h-7 lg:w-8 lg:h-8 rounded-full object-cover"
              />
              <h1 className="font-heading text-xl lg:text-2xl font-semibold text-primary">
                Levants Dairy
              </h1>
            </Link>

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
              <button
                onClick={openCart}
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

        {isMenuOpen && (
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
      </header>
    </>
  );
};

export default Header;

import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  RefreshCcw,
  CreditCard,
  Wallet,
  ArrowLeft,
  MapPin,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ExternalLink,
  Sun,
  Moon,
  Home,
  ShoppingBag,
  Star,
  Info,
  Mail,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/portal/context/ThemeContext";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { clearPortalAuth } from "@/lib/portalAuth";
import { portalAuthApi } from "@/api/portalAuth";
import {
  CustomerProvider,
  usePortalCustomer,
} from "@/portal/context/CustomerContext";
import { AddressesProvider } from "@/portal/context/AddressesContext";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  {
    label: "My Subscriptions",
    href: "/portal/subscriptions",
    icon: RefreshCcw,
  },
  { label: "My Orders", href: "/portal/orders", icon: ClipboardList },
  { label: "Payments", href: "/portal/payments", icon: CreditCard },
  { label: "Store Credit", href: "/portal/credit", icon: Wallet },
  { label: "Addresses", href: "/portal/addresses", icon: MapPin },
  { label: "Account", href: "/portal/account", icon: Settings },
];

const siteItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "About", href: "/about", icon: Info },
  { label: "Delivery & FAQs", href: "/delivery", icon: MapPin },
  { label: "Contact", href: "/contact", icon: Mail },
];

interface PortalLayoutProps {
  children: React.ReactNode;
}

const PortalLayoutInner: React.FC<PortalLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSubscriptionBuilderRoute =
    location.pathname === "/portal/subscriptions/new";
  const isAddProductsRoute =
    /\/portal\/subscriptions\/.+\/(add-products|next-delivery\/add-ons)$/.test(
      location.pathname,
    );
  const hideDesktopSidebar = isSubscriptionBuilderRoute || isAddProductsRoute;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Measure the sticky site header so the desktop sidebar sits below it
  // instead of sliding underneath the navbar.
  const [siteHeaderHeight, setSiteHeaderHeight] = useState(0);
  useEffect(() => {
    const headerEl = document.querySelector("header");
    if (!headerEl) return;
    const update = () =>
      setSiteHeaderHeight(headerEl.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(headerEl);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  const sidebarTopOffset = siteHeaderHeight + 16;
  const { theme, setThemePreference } = useTheme();
  const { customer, updateCustomerProfile } = usePortalCustomer();

  const firstName = customer?.firstName || "Customer";
  const fullName =
    [customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Customer";
  const email = customer?.email || "";
  const avatarInitials =
    `${customer?.firstName?.[0] || ""}${customer?.lastName?.[0] || ""}`.toUpperCase() ||
    "CU";

  useEffect(() => {
    const dbTheme = customer?.themePreference;
    if (!dbTheme) return;
    setThemePreference(dbTheme);
  }, [customer?.themePreference, setThemePreference]);

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setThemePreference(nextTheme);
    void updateCustomerProfile({ themePreference: nextTheme });
  };

  const handleLogout = async () => {
    try {
      await portalAuthApi.logout();
    } catch {
      // Clear client auth state even if server session is already invalid.
    }
    clearPortalAuth();
    navigate("/login");
  };

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Customer Portal
        </p>
        <p className="text-sm font-medium text-foreground mt-1">Quick links</p>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Portal
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/portal/dashboard"
                ? location.pathname === "/portal/dashboard"
                : location.pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-forest text-primary-foreground"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-3 mt-5 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Website
        </p>
        <ul className="space-y-0.5">
          {siteItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-foreground hover:bg-muted"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Shop link */}
      <div className="px-3 pb-1">
        <a
          href="/shop"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <ExternalLink className="h-4 w-4 flex-shrink-0" />
          Browse Products
        </a>
      </div>

      {/* Bottom: profile & logout */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors">
          <div className="w-8 h-8 rounded-full bg-forest/15 flex items-center justify-center text-forest text-xs font-bold flex-shrink-0">
            {avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {fullName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors mt-1"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </nav>
  );

  const portalActions = (
    <>
      {isSubscriptionBuilderRoute && (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
        >
          <Link to="/portal/subscriptions">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={handleThemeToggle}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <div className="relative">
        <button
          className="flex items-center gap-2 pl-2 pr-2 sm:pr-3 py-1.5 rounded-xl hover:bg-muted transition-colors text-sm"
          onClick={() => setProfileOpen((v) => !v)}
        >
          <div className="w-7 h-7 rounded-full bg-forest/15 flex items-center justify-center text-forest text-xs font-bold">
            {avatarInitials}
          </div>
          <span className="hidden sm:block font-medium text-foreground">
            {firstName}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {profileOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setProfileOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium">{fullName}</p>
                <p className="text-xs text-muted-foreground">{email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/portal/account"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Account Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        actions={portalActions}
        showAccountLink={false}
        onMenuClick={() => setSidebarOpen(true)}
        onCartClick={() => navigate("/checkout")}
      />

      <div
        className={cn(
          "container-custom py-4 lg:py-6 flex flex-1 items-start",
          hideDesktopSidebar ? "gap-0" : "gap-4 lg:gap-6",
        )}
      >
        {/* Desktop Sidebar */}
        {!hideDesktopSidebar && (
          <aside
            className="hidden lg:flex flex-col w-60 rounded-2xl border border-border bg-card/90 backdrop-blur-sm flex-shrink-0 lg:sticky overflow-hidden"
            style={{
              top: sidebarTopOffset,
              maxHeight: `calc(100vh - ${sidebarTopOffset + 16}px)`,
            }}
          >
            <SidebarContent />
          </aside>
        )}

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        {
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:hidden",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        }

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Page content — keyed by pathname so the animation re-triggers on every navigation */}
          <main
            key={location.pathname}
            className="portal-page-enter flex-1 pb-6"
          >
            {customer?.pendingEmail ? (
              <Alert className="mb-4 border-amber-400/40 bg-amber-50 text-amber-900">
                <AlertDescription>
                  Email change pending: confirm the link sent to{" "}
                  {customer.pendingEmail} to complete the update.
                </AlertDescription>
              </Alert>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => (
  <ThemeProvider>
    <CustomerProvider>
      <AddressesProvider>
        <PortalLayoutInner>{children}</PortalLayoutInner>
      </AddressesProvider>
    </CustomerProvider>
  </ThemeProvider>
);

export default PortalLayout;

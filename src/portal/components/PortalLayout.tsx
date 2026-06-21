import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  RefreshCcw,
  Truck,
  CreditCard,
  MapPin,
  HeadphonesIcon,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  Sun,
  Moon,
} from "lucide-react";
import { ThemeProvider, useTheme } from "@/portal/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockCustomer, mockNotifications } from "@/portal/data/mockData";
import { cn } from "@/lib/utils";
import { clearPortalAuth } from "@/lib/portalAuth";

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  {
    label: "My Subscriptions",
    href: "/portal/subscriptions",
    icon: RefreshCcw,
  },
  { label: "My Orders", href: "/portal/orders", icon: ClipboardList },
  { label: "Deliveries", href: "/portal/deliveries", icon: Truck },
  { label: "Payments", href: "/portal/payments", icon: CreditCard },
  { label: "Addresses", href: "/portal/addresses", icon: MapPin },
  { label: "Support", href: "/portal/support", icon: HeadphonesIcon },
  { label: "Account", href: "/portal/account", icon: Settings },
];

interface PortalLayoutProps {
  children: React.ReactNode;
}

const PortalLayoutInner: React.FC<PortalLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    clearPortalAuth();
    navigate("/login");
  };

  const SidebarContent = () => (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link to="/" className="block" onClick={() => setSidebarOpen(false)}>
          <h1 className="font-heading text-xl font-bold text-forest">
            Levants Dairy
          </h1>
          <p className="text-xs text-muted-foreground">Customer Portal</p>
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
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
            {mockCustomer.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {mockCustomer.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {mockCustomer.email}
            </p>
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-card flex-shrink-0 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          {/* Left: hamburger (mobile) + page breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-foreground hidden sm:block">
              {navItems.find((n) =>
                n.href === "/portal/dashboard"
                  ? location.pathname === "/portal/dashboard"
                  : location.pathname.startsWith(n.href),
              )?.label ?? "Portal"}
            </span>
          </div>

          {/* Right: icons + profile */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link to="/portal/notifications">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                )}
              </Link>
            </Button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-muted transition-colors text-sm"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <div className="w-7 h-7 rounded-full bg-forest/15 flex items-center justify-center text-forest text-xs font-bold">
                  {mockCustomer.avatarInitials}
                </div>
                <span className="hidden sm:block font-medium text-foreground">
                  {mockCustomer.name.split(" ")[0]}
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
                      <p className="text-sm font-medium">{mockCustomer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {mockCustomer.email}
                      </p>
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
          </div>
        </header>

        {/* Page content — keyed by pathname so the animation re-triggers on every navigation */}
        <main
          key={location.pathname}
          className="portal-page-enter flex-1 p-4 lg:p-6 pb-24 lg:pb-6"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border lg:hidden">
        <ul className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/portal/dashboard"
                ? location.pathname === "/portal/dashboard"
                : location.pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                    isActive ? "text-forest" : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">
                    {item.label.split(" ")[0]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => (
  <ThemeProvider>
    <PortalLayoutInner>{children}</PortalLayoutInner>
  </ThemeProvider>
);

export default PortalLayout;

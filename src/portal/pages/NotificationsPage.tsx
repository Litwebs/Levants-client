import React, { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  Truck,
  RefreshCcw,
  CreditCard,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockNotifications, type Notification } from "@/portal/data/mockData";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";
import { cn } from "@/lib/utils";

const notificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "order":
      return <ShoppingBag className="h-4 w-4" />;
    case "delivery":
      return <Truck className="h-4 w-4" />;
    case "subscription":
      return <RefreshCcw className="h-4 w-4" />;
    case "payment":
      return <CreditCard className="h-4 w-4" />;
    case "offer":
      return <Tag className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const notificationColor = (type: Notification["type"]) => {
  switch (type) {
    case "order":
      return "bg-blue-100 text-blue-600";
    case "delivery":
      return "bg-orange-100 text-orange-600";
    case "subscription":
      return "bg-green-100 text-green-600";
    case "payment":
      return "bg-red-100 text-red-600";
    case "offer":
      return "bg-yellow-100 text-yellow-600";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const NotificationItem: React.FC<{
  notification: Notification;
  onMarkRead: () => void;
}> = ({ notification: n, onMarkRead }) => (
  <div
    className={cn(
      "flex items-start gap-3 p-4 rounded-xl border transition-colors",
      !n.read ? "border-forest/20 bg-forest/5" : "border-border bg-card",
    )}
  >
    <div
      className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
        notificationColor(n.type),
      )}
    >
      {notificationIcon(n.type)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium",
            !n.read ? "text-foreground" : "text-foreground/80",
          )}
        >
          {n.title}
        </p>
        {!n.read && (
          <span className="w-2 h-2 rounded-full bg-forest flex-shrink-0 mt-1.5" />
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
      <p className="text-xs text-muted-foreground mt-1">{n.date}</p>
    </div>
    {!n.read && (
      <button
        onClick={onMarkRead}
        className="text-muted-foreground hover:text-forest transition-colors flex-shrink-0 mt-0.5"
        title="Mark as read"
      >
        <Check className="h-4 w-4" />
      </button>
    )}
  </div>
);

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const unread = notifications.filter((n) => !n.read);
  const all = notifications;

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="Notifications"
        description={`${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`}
        action={
          unread.length > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="all">
        <TabsList className="mb-5">
          <TabsTrigger value="all">All ({all.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {all.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-16 w-16" />}
              title="No notifications"
              description="You're all caught up!"
            />
          ) : (
            <div className="space-y-2">
              {all.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={() => markRead(n.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unread.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-16 w-16" />}
              title="No unread notifications"
              description="You're all caught up!"
            />
          ) : (
            <div className="space-y-2">
              {unread.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={() => markRead(n.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;

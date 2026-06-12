import React from "react";
import { Truck, CalendarDays, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockDeliveries, type Delivery } from "@/portal/data/mockData";
import { DeliveryStatusBadge } from "@/portal/components/StatusBadges";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";

const DeliveryCard: React.FC<{ delivery: Delivery }> = ({ delivery: d }) => (
  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <CalendarDays className="h-4 w-4 text-forest" />
          <p className="text-sm font-semibold text-foreground">{d.date}</p>
        </div>
        <p className="text-xs text-muted-foreground">{d.window}</p>
      </div>
      <DeliveryStatusBadge status={d.status} />
    </div>

    <div className="space-y-1.5 mb-3 text-xs text-muted-foreground">
      <p>
        <span className="font-medium text-foreground">Reference: </span>
        {d.reference} ({d.referenceType})
      </p>
      <p>
        <span className="font-medium text-foreground">Products: </span>
        {d.productsSummary}
      </p>
      <p>
        <span className="font-medium text-foreground">Address: </span>
        {d.address}
      </p>
    </div>

    <div className="flex gap-2">
      {d.canReschedule && d.status === "scheduled" && (
        <Button variant="outline" size="sm">
          <CalendarDays className="h-3.5 w-3.5" />
          Reschedule
        </Button>
      )}
      {d.status === "failed" && (
        <Button size="sm">
          <CalendarDays className="h-3.5 w-3.5" />
          Reschedule
        </Button>
      )}
      <Button variant="ghost" size="sm">
        View details
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);

const DeliveriesPage: React.FC = () => {
  const upcoming = mockDeliveries.filter((d) =>
    ["scheduled", "preparing", "out-for-delivery"].includes(d.status),
  );
  const past = mockDeliveries.filter((d) => d.status === "delivered");
  const failed = mockDeliveries.filter((d) =>
    ["failed", "rescheduled"].includes(d.status),
  );

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Deliveries"
        description="Track your upcoming and past deliveries"
      />

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-5">
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          <TabsTrigger value="failed">Issues ({failed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-16 w-16" />}
              title="No upcoming deliveries"
              description="Place an order or create a subscription to schedule your first delivery."
            />
          ) : (
            <div className="space-y-4">
              {upcoming.map((d) => (
                <DeliveryCard key={d.id} delivery={d} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {past.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-16 w-16" />}
              title="No past deliveries yet"
            />
          ) : (
            <div className="space-y-4">
              {past.map((d) => (
                <DeliveryCard key={d.id} delivery={d} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="failed">
          {failed.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-16 w-16" />}
              title="No failed or rescheduled deliveries"
            />
          ) : (
            <div className="space-y-4">
              {failed.map((d) => (
                <DeliveryCard key={d.id} delivery={d} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeliveriesPage;

import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, RotateCcw, Printer, HeadphonesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mockOrders } from "@/portal/data/mockData";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/portal/components/StatusBadges";
import { OrderTimeline } from "@/portal/components/PortalUI";

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const order = mockOrders.find((o) => o.id === id) ?? mockOrders[0];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
          <Link to="/portal/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground">
            {order.orderNumber}
          </h1>
          <p className="text-xs text-muted-foreground">
            Placed on {order.date}
          </p>
        </div>
      </div>

      {/* Status overview */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Order Timeline
          </p>
          <OrderTimeline status={order.status} />
        </div>
      </div>

      {/* Products */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-foreground mb-3">Items Ordered</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-foreground">
                  {item.productName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.variant} × {item.quantity}
                </p>
              </div>
              <span className="font-semibold">{item.price}</span>
            </div>
          ))}
        </div>
        <Separator className="my-3" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>{order.total}</span>
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4 space-y-3">
        <h3 className="font-semibold text-foreground">Delivery Information</h3>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Address
          </p>
          <p className="text-sm text-foreground">{order.deliveryAddress}</p>
        </div>
        {order.deliveryInstructions && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
              Instructions
            </p>
            <p className="text-sm text-muted-foreground italic">
              {order.deliveryInstructions}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Estimated Delivery
          </p>
          <p className="text-sm font-medium text-foreground">
            {order.estimatedDelivery}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm">
          <RotateCcw className="h-3.5 w-3.5" />
          Reorder
        </Button>
        <Button variant="outline" size="sm">
          <Printer className="h-3.5 w-3.5" />
          Receipt / Invoice
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link to="/portal/support">
            <HeadphonesIcon className="h-3.5 w-3.5" />
            Contact Support
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default OrderDetailPage;

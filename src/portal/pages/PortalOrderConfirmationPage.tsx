import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Truck, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

const PortalOrderConfirmationPage: React.FC = () => {
  const orderNumber = "LVD-20240627-005";
  const estimatedDelivery = "27 Jun 2024, 8:00am – 12:00pm";

  return (
    <div className="max-w-lg mx-auto py-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-forest/10 mb-6">
        <CheckCircle2 className="h-10 w-10 text-forest" />
      </div>

      <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
        Order Confirmed!
      </h1>
      <p className="text-muted-foreground mb-6">
        Thank you for your order. We'll get it ready for delivery.
      </p>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-left space-y-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Order Number
          </p>
          <p className="font-semibold text-foreground">{orderNumber}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">
            Estimated Delivery
          </p>
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-forest" />
            <p className="font-semibold text-foreground">{estimatedDelivery}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          You'll receive a confirmation notification once your order is being
          prepared.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <Link to="/portal/orders/ord-003">
            <ClipboardList className="h-4 w-4" />
            View Order
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/portal/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default PortalOrderConfirmationPage;

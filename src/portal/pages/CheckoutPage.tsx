import React, { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, CalendarDays, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockCartItems,
  mockAddresses,
  mockPaymentMethods,
} from "@/portal/data/mockData";
import { PageHeader } from "@/portal/components/PortalUI";
import { cn } from "@/lib/utils";

const CheckoutPage: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState(
    mockAddresses.find((a) => a.isDefault)?.id ?? mockAddresses[0]?.id,
  );
  const [selectedPayment, setSelectedPayment] = useState(
    mockPaymentMethods.find((p) => p.isDefault)?.id ??
      mockPaymentMethods[0]?.id,
  );
  const [deliveryDate, setDeliveryDate] = useState("2024-06-27");
  const [deliveryWindow, setDeliveryWindow] = useState("morning");
  const [notes, setNotes] = useState("");

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Checkout"
        description="Review your order and complete your purchase"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Delivery Address */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-forest" />
              Delivery Address
            </h3>
            <div className="space-y-2 mb-3">
              {mockAddresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    selectedAddress === addr.id
                      ? "border-forest bg-forest/5"
                      : "border-border hover:border-forest/50",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{addr.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                        {addr.postcode}
                      </p>
                      {addr.instructions && (
                        <p className="text-xs text-muted-foreground italic mt-0.5">
                          {addr.instructions}
                        </p>
                      )}
                    </div>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium ml-2 flex-shrink-0">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal/addresses">
                <MapPin className="h-3.5 w-3.5" />
                Add new address
              </Link>
            </Button>
          </div>

          {/* Delivery Date & Window */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-forest" />
              Delivery Schedule
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryDate">Delivery date</Label>
                <input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery window</Label>
                <Select
                  value={deliveryWindow}
                  onValueChange={setDeliveryWindow}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">
                      Morning (8am – 12pm)
                    </SelectItem>
                    <SelectItem value="afternoon">
                      Afternoon (12pm – 5pm)
                    </SelectItem>
                    <SelectItem value="evening">Evening (5pm – 8pm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-forest" />
              Payment Method
            </h3>
            <div className="space-y-2 mb-3">
              {mockPaymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setSelectedPayment(pm.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-colors",
                    selectedPayment === pm.id
                      ? "border-forest bg-forest/5"
                      : "border-border hover:border-forest/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {pm.label} •••• {pm.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {pm.expiry}
                      </p>
                    </div>
                    {pm.isDefault && (
                      <span className="text-[10px] bg-forest/10 text-forest rounded-full px-1.5 py-0.5 font-medium">
                        Default
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/portal/payments">
                <CreditCard className="h-3.5 w-3.5" />
                Manage payment methods
              </Link>
            </Button>
          </div>

          {/* Order Notes */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold text-foreground mb-3">Order Notes</h3>
            <Textarea
              placeholder="Any special instructions for this order…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
            <h3 className="font-semibold text-foreground mb-4">
              Order Summary
            </h3>
            <div className="space-y-2">
              {mockCartItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productName} ×{item.quantity}
                  </span>
                  <span className="font-medium">{item.price}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>—</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery fee</span>
                <span>—</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base text-foreground">
                <span>Total</span>
                <span>—</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Final total confirmed at payment
            </p>
            <Button asChild className="w-full mt-4">
              <Link to="/portal/order-confirmation">
                Confirm Order
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

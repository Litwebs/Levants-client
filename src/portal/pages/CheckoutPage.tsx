import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  CreditCard,
  ChevronRight,
  Loader2,
} from "lucide-react";
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
import { mockCartItems, mockPaymentMethods } from "@/portal/data/mockData";
import { PageHeader } from "@/portal/components/PortalUI";
import { useAddresses } from "@/portal/context/AddressesContext";
import { cn } from "@/lib/utils";

const CheckoutPage: React.FC = () => {
  const {
    addresses,
    loading: addressesLoading,
    fetchAddresses,
    createAddress,
  } = useAddresses();
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    postcode: "",
    country: "",
    deliveryInstructions: "",
    isDefault: false,
  });
  const [newAddressError, setNewAddressError] = useState<string | null>(null);
  const [newAddressLoading, setNewAddressLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(
    mockPaymentMethods.find((p) => p.isDefault)?.id ??
      mockPaymentMethods[0]?.id,
  );
  const [deliveryDate, setDeliveryDate] = useState("2024-06-27");
  const [deliveryWindow, setDeliveryWindow] = useState("morning");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  useEffect(() => {
    // Set default or first address if not selected
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      setSelectedAddress(defaultAddr?._id ?? addresses[0]?._id ?? null);
    }
  }, [addresses, selectedAddress]);

  const resetNewAddressForm = () => {
    setNewAddressForm({
      fullName: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      postcode: "",
      country: "",
      deliveryInstructions: "",
      isDefault: false,
    });
    setNewAddressError(null);
    setShowAddressForm(false);
  };

  const handleCreateAddress = async () => {
    const line1 = newAddressForm.line1.trim();
    const city = newAddressForm.city.trim();
    const postcode = newAddressForm.postcode.trim();
    const country = newAddressForm.country.trim();

    if (!line1 || !city || !postcode || !country) {
      setNewAddressError("Please complete the required address fields.");
      return;
    }

    try {
      setNewAddressLoading(true);
      setNewAddressError(null);

      const createdAddress = await createAddress({
        ...newAddressForm,
        fullName: newAddressForm.fullName.trim(),
        phone: newAddressForm.phone.trim(),
        line1,
        line2: newAddressForm.line2.trim(),
        city,
        postcode,
        country,
        deliveryInstructions: newAddressForm.deliveryInstructions.trim(),
        isDefault: newAddressForm.isDefault,
      });

      const nextAddressId = createdAddress._id ?? createdAddress.id ?? null;
      if (nextAddressId) {
        setSelectedAddress(nextAddressId);
      }

      resetNewAddressForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create address";
      setNewAddressError(message);
    } finally {
      setNewAddressLoading(false);
    }
  };

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
            {addressesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                <p>No saved addresses yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-3">
                  {addresses.map((addr) => (
                    <button
                      key={addr._id}
                      onClick={() => setSelectedAddress(addr._id ?? null)}
                      className={cn(
                        "w-full text-left p-3 rounded-xl border transition-colors",
                        selectedAddress === addr._id
                          ? "border-forest bg-forest/5"
                          : "border-border hover:border-forest/50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {addr.fullName ||
                              addr.label ||
                              addr.line1 ||
                              "Address"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                            {addr.postcode}
                          </p>
                          {addr.deliveryInstructions && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">
                              {addr.deliveryInstructions}
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
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowAddressForm((current) => !current)}
            >
              <MapPin className="h-3.5 w-3.5" />
              Add new address
            </Button>

            {showAddressForm && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4 space-y-4">
                {newAddressError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {newAddressError}
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-address-fullname">Full name</Label>
                    <input
                      id="checkout-address-fullname"
                      value={newAddressForm.fullName}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          fullName: event.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-address-phone">Phone number</Label>
                    <input
                      id="checkout-address-phone"
                      value={newAddressForm.phone}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-address-line1">
                    Address line 1 *
                  </Label>
                  <input
                    id="checkout-address-line1"
                    value={newAddressForm.line1}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        line1: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-address-line2">
                    Address line 2 (optional)
                  </Label>
                  <input
                    id="checkout-address-line2"
                    value={newAddressForm.line2}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        line2: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-address-city">City *</Label>
                    <input
                      id="checkout-address-city"
                      value={newAddressForm.city}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          city: event.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="checkout-address-postcode">
                      Postcode *
                    </Label>
                    <input
                      id="checkout-address-postcode"
                      value={newAddressForm.postcode}
                      onChange={(event) =>
                        setNewAddressForm((prev) => ({
                          ...prev,
                          postcode: event.target.value,
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-address-country">Country *</Label>
                  <input
                    id="checkout-address-country"
                    value={newAddressForm.country}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        country: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="checkout-address-delivery-instructions">
                    Delivery instructions (optional)
                  </Label>
                  <Textarea
                    id="checkout-address-delivery-instructions"
                    value={newAddressForm.deliveryInstructions}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        deliveryInstructions: event.target.value,
                      }))
                    }
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={newAddressForm.isDefault}
                    onChange={(event) =>
                      setNewAddressForm((prev) => ({
                        ...prev,
                        isDefault: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-forest focus:ring-forest"
                  />
                  Set as default delivery address
                </label>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={resetNewAddressForm}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateAddress}
                    disabled={newAddressLoading}
                    type="button"
                  >
                    {newAddressLoading ? "Saving..." : "Save address"}
                  </Button>
                </div>
              </div>
            )}
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

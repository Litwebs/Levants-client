import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronLeft, Lock, Truck, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/Orders/OrdersContext";
import { toast } from "sonner";

type CheckoutStep = 1 | 2 | 3;

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal } = useCart();
  const {
    customer,
    createGuestCustomer,
    createOrder,
    validateDiscount,
    loading,
    error,
  } = useOrders();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);

  const [discountCode, setDiscountCode] = useState("");
  const [validatedDiscount, setValidatedDiscount] = useState<{
    code: string;
    discountAmount: number;
    eligibleSubtotal: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    postcode: "",
    deliveryInstructions: "",
  });

  const steps = [
    { id: 1, name: "Details", icon: "👤" },
    { id: 2, name: "Delivery", icon: "📍" },
    { id: 3, name: "Payment", icon: "💳" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isBlank = (v: string) => !v || v.trim().length === 0;
  const isValidEmail = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

  const validateStep = (step: CheckoutStep): boolean => {
    if (step === 1) {
      if (isBlank(formData.firstName)) {
        toast.error("Please enter your first name.");
        return false;
      }
      if (isBlank(formData.lastName)) {
        toast.error("Please enter your last name.");
        return false;
      }
      if (isBlank(formData.email)) {
        toast.error("Please enter your email address.");
        return false;
      }
      if (!isValidEmail(formData.email)) {
        toast.error("Please enter a valid email address.");
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (isBlank(formData.address1)) {
        toast.error("Please enter your address.");
        return false;
      }
      if (isBlank(formData.city)) {
        toast.error("Please enter your city.");
        return false;
      }
      if (isBlank(formData.postcode)) {
        toast.error("Please enter your postcode.");
        return false;
      }
      return true;
    }

    return true;
  };

  const ensureDiscountValidatedIfNeeded = async (customerId: string) => {
    const code = discountCode.trim();
    if (!code) {
      setValidatedDiscount(null);
      return true;
    }

    if (
      validatedDiscount &&
      validatedDiscount.code.toUpperCase() === code.toUpperCase()
    ) {
      return true;
    }

    const orderItems = items.map((item) => ({
      variantId: item.variant?.id || item.product.id,
      quantity: item.quantity,
    }));

    const res = await validateDiscount({
      customerId,
      discountCode: code,
      items: orderItems,
    });

    if (!res) {
      toast.error("Invalid discount code");
      return false;
    }

    setValidatedDiscount({
      code: res.discountCode,
      discountAmount: res.discountAmount,
      eligibleSubtotal: res.eligibleSubtotal,
    });
    toast.success("Discount code applied", {
      description: `-£${Number(res.discountAmount || 0).toFixed(2)}`,
    });
    return true;
  };

  const handleNext = async () => {
    if (loading) return;
    if (!validateStep(currentStep)) return;

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Create guest customer here (we have full address now) so we can validate discounts before payment.
      const created =
        customer ??
        (await createGuestCustomer({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          address: {
            line1: formData.address1,
            line2: formData.address2 || undefined,
            city: formData.city,
            postcode: formData.postcode,
            country: "UK",
          },
        }));

      if (!created) {
        toast.error("Failed to process your details. Please try again.");
        return;
      }

      const ok = await ensureDiscountValidatedIfNeeded(created._id);
      if (!ok) return;

      setCurrentStep(3);
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckoutStep);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      const ensuredCustomer =
        customer ??
        (await createGuestCustomer({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          address: {
            line1: formData.address1,
            line2: formData.address2 || undefined,
            city: formData.city,
            postcode: formData.postcode,
            country: "UK",
          },
        }));

      if (!ensuredCustomer) {
        toast.error("Failed to process your details. Please try again.");
        return;
      }

      // If a code is entered, require it to be validated before sending to order creation.
      const ok = await ensureDiscountValidatedIfNeeded(ensuredCustomer._id);
      if (!ok) {
        toast.error("Please fix your discount code before placing the order.");
        return;
      }

      // 2. Create order → get Stripe checkout URL
      const orderItems = items.map((item) => ({
        variantId: item.variant?.id || item.product.id,
        quantity: item.quantity,
      }));

      const checkoutUrl = await createOrder({
        customerId: ensuredCustomer._id,
        items: orderItems,
        deliveryAddress: {
          line1: formData.address1,
          line2: formData.address2 || undefined,
          city: formData.city,
          postcode: formData.postcode,
          country: "UK",
        },
        deliveryInstructions: formData.deliveryInstructions || undefined,
        discountCode:
          validatedDiscount?.code || discountCode.trim() || undefined,
      });

      if (checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = checkoutUrl;
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const discountAmount = Number(validatedDiscount?.discountAmount || 0);
  const displaySubtotal = Math.max(0, subtotal - discountAmount);
  const displayTotal = displaySubtotal;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold mb-4">
            Your cart is empty
          </h1>
          <Link to="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="font-heading text-xl font-semibold text-primary"
            >
              Levants Dairy
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              Secure Checkout
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        {/* Progress Steps */}
        <div className="mb-8 lg:mb-12">
          <div className="flex items-center justify-center gap-2 lg:gap-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 ${
                    step.id <= currentStep
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id < currentStep
                        ? "bg-primary text-primary-foreground"
                        : step.id === currentStep
                          ? "bg-primary/10 border-2 border-primary text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">
                    {step.name}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 lg:w-16 h-0.5 ${
                      step.id < currentStep ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            {/* Step 1: Customer Details */}
            {currentStep === 1 && (
              <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">
                  Your Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="+44 7123 456789"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Delivery Address */}
            {currentStep === 2 && (
              <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">
                  Delivery Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address Line 1
                    </label>
                    <input
                      type="text"
                      name="address1"
                      value={formData.address1}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="123 Farm Lane"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Address Line 2 (Optional)
                    </label>
                    <input
                      type="text"
                      name="address2"
                      value={formData.address2}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Cambridge"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Postcode
                      </label>
                      <input
                        type="text"
                        name="postcode"
                        value={formData.postcode}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="CB1 2AB"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Delivery Instructions (Optional)
                    </label>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      className="input-field min-h-[100px]"
                      placeholder="Leave at door, ring bell, etc."
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary/50 rounded-xl flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Delivered Chilled</p>
                    <p className="text-muted-foreground">
                      Your order will arrive in insulated packaging to keep
                      products fresh.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Payment (Stripe redirect) */}
            {currentStep === 3 && (
              <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">
                  Payment
                </h2>

                <div className="space-y-4">
                  <div className="p-6 bg-secondary/30 rounded-xl text-center">
                    <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-heading text-lg font-medium mb-2">
                      Secure Stripe Checkout
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      When you click "Place Order", you'll be redirected to
                      Stripe's secure payment page to complete your purchase.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <Lock className="w-5 h-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-medium text-primary">Secure Payment</p>
                      <p className="text-muted-foreground">
                        Your payment information is encrypted and secure via
                        Stripe.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              {currentStep > 1 ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <Link
                  to="/"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Cancel
                </Link>
              )}

              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  className="btn-primary"
                  disabled={loading}
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  className="btn-primary flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order - £${displayTotal.toFixed(2)}`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
              <h3 className="font-heading text-lg font-semibold mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product.price;
                  return (
                    <div
                      key={
                        item.variant
                          ? `${item.product.id}-${item.variant.id}`
                          : item.product.id
                      }
                      className="flex gap-3"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.variant?.name} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        £{(price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Discount Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 input-field py-2.5"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setValidatedDiscount(null);
                    }}
                  />
                  <button
                    type="button"
                    className="btn-outline py-2.5 px-4"
                    disabled={loading}
                    onClick={async () => {
                      // Minimal UX: can only validate once we have a customerId (created on Step 2 → Step 3).
                      if (!discountCode.trim()) {
                        toast.error("Enter a discount code first.");
                        return;
                      }
                      if (!customer) {
                        toast.error(
                          "Complete your details and delivery address first, then continue to Payment to apply the code.",
                        );
                        return;
                      }
                      await ensureDiscountValidatedIfNeeded(customer._id);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-£{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>
                    <span className="text-primary font-medium">FREE</span>
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>£{displayTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

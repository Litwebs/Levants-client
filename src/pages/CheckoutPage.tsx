import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, CreditCard, Lock, Truck, Calendar, Clock } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

type CheckoutStep = 1 | 2 | 3 | 4;

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1);
  
  const [formData, setFormData] = useState({
    // Customer details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Delivery
    address1: '',
    address2: '',
    city: '',
    postcode: '',
    deliveryInstructions: '',
    // Delivery slot
    deliveryDate: '',
    deliveryTime: '',
  });

  const steps = [
    { id: 1, name: 'Details', icon: '👤' },
    { id: 2, name: 'Delivery', icon: '📍' },
    { id: 3, name: 'Time Slot', icon: '📅' },
    { id: 4, name: 'Payment', icon: '💳' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as CheckoutStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckoutStep);
    }
  };

  const handlePlaceOrder = () => {
    // Simulate order placement
    clearCart();
    navigate('/order-confirmation');
    toast.success('Order placed successfully!');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-semibold mb-4">Your cart is empty</h1>
          <Link to="/shop" className="btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Generate next 7 days for delivery
  const deliveryDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date.toISOString().split('T')[0];
  });

  const timeSlots = [
    { id: 'morning', label: '8am - 12pm', icon: '🌅' },
    { id: 'afternoon', label: '12pm - 4pm', icon: '☀️' },
    { id: 'evening', label: '4pm - 8pm', icon: '🌆' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-heading text-xl font-semibold text-primary">
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
                    step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id === currentStep
                        ? 'bg-primary/10 border-2 border-primary text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.id < currentStep ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="hidden sm:block text-sm font-medium">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 lg:w-16 h-0.5 ${
                      step.id < currentStep ? 'bg-primary' : 'bg-border'
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
                    <label className="block text-sm font-medium mb-2">First Name</label>
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
                    <label className="block text-sm font-medium mb-2">Last Name</label>
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
                    <label className="block text-sm font-medium mb-2">Email</label>
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
                    <label className="block text-sm font-medium mb-2">Phone</label>
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
                    <label className="block text-sm font-medium mb-2">Address Line 1</label>
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
                    <label className="block text-sm font-medium mb-2">Address Line 2 (Optional)</label>
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
                      <label className="block text-sm font-medium mb-2">City</label>
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
                      <label className="block text-sm font-medium mb-2">Postcode</label>
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
                    <label className="block text-sm font-medium mb-2">Delivery Instructions (Optional)</label>
                    <textarea
                      name="deliveryInstructions"
                      value={formData.deliveryInstructions}
                      onChange={handleInputChange}
                      className="input-field min-h-[100px]"
                      placeholder="Leave at door, ring bell, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Delivery Slot */}
            {currentStep === 3 && (
              <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">
                  Choose Delivery Slot
                </h2>

                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Select a delivery date
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                    {deliveryDates.map((date) => {
                      const d = new Date(date);
                      const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
                      const dayNum = d.getDate();
                      const month = d.toLocaleDateString('en-GB', { month: 'short' });

                      return (
                        <button
                          key={date}
                          onClick={() => setFormData((prev) => ({ ...prev, deliveryDate: date }))}
                          className={`p-3 rounded-xl border-2 text-center transition-colors ${
                            formData.deliveryDate === date
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-xs text-muted-foreground">{dayName}</div>
                          <div className="text-lg font-semibold">{dayNum}</div>
                          <div className="text-xs text-muted-foreground">{month}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Select a time slot
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setFormData((prev) => ({ ...prev, deliveryTime: slot.id }))}
                        className={`p-4 rounded-xl border-2 text-center transition-colors ${
                          formData.deliveryTime === slot.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-2xl mb-1">{slot.icon}</div>
                        <div className="font-medium">{slot.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-4 bg-secondary/50 rounded-xl flex items-start gap-3">
                  <Truck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Delivered Chilled</p>
                    <p className="text-muted-foreground">
                      Your order will arrive in insulated packaging to keep products fresh.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="bg-card rounded-2xl border border-border p-6 lg:p-8">
                <h2 className="font-heading text-2xl font-semibold mb-6">
                  Payment
                </h2>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        className="input-field pl-12"
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Name on Card</label>
                    <input
                      type="text"
                      placeholder="John Smith"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <Lock className="w-5 h-5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium text-primary">Secure Payment</p>
                    <p className="text-muted-foreground">
                      Your payment information is encrypted and secure.
                    </p>
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
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <Link
                  to="/cart"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Cart
                </Link>
              )}

              {currentStep < 4 ? (
                <button onClick={handleNext} className="btn-primary">
                  Continue
                </button>
              ) : (
                <button onClick={handlePlaceOrder} className="btn-primary">
                  Place Order - £{total.toFixed(2)}
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
                      key={item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id}
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
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
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

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-primary font-medium">FREE</span>
                    ) : (
                      `£${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
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

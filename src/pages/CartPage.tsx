import React from "react";
import { Link } from "react-router-dom";
import { Trash2, ArrowRight, ShoppingBag, Tag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import QuantityStepper from "@/components/ui/QuantityStepper";

const CartPage: React.FC = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    deliveryFee,
    total,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-16 lg:py-24">
          <div className="max-w-lg mx-auto text-center">
            <ShoppingBag className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
            <h1 className="font-heading text-3xl font-semibold mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any products to your cart yet. Start
              shopping our farm-fresh collection!
            </p>
            <Link
              to="/shop"
              className="btn-primary inline-flex items-center gap-2"
            >
              Start Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary/30 py-12 lg:py-16">
        <div className="container-custom">
          <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
            Your Cart
          </h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>
      </div>

      <div className="container-custom py-8 lg:py-12">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const itemKey = item.variant
                ? `${item.product.id}-${item.variant.id}`
                : item.product.id;
              const price = item.variant?.price ?? item.product.price;

              return (
                <div
                  key={itemKey}
                  className="flex gap-4 lg:gap-6 p-4 lg:p-6 bg-card rounded-2xl border border-border"
                >
                  {/* Image */}
                  <Link
                    to={`/product/${item.product.id}`}
                    className="w-24 h-24 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-muted flex-shrink-0"
                  >
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-4">
                      <div>
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-heading text-lg font-medium hover:text-primary transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        {item.variant && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.variant.name}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-lg whitespace-nowrap">
                        £{(price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      £{price.toFixed(2)} each
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <QuantityStepper
                        quantity={item.quantity}
                        onQuantityChange={(qty) =>
                          updateQuantity(item.product.id, qty, item.variant?.id)
                        }
                        max={
                          typeof item.variant?.stockQuantity === "number"
                            ? Math.max(0, item.variant.stockQuantity)
                            : 99
                        }
                        size="sm"
                      />
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.variant?.id)
                        }
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Clear Cart */}
            <button
              onClick={clearCart}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
              <h2 className="font-heading text-xl font-semibold mb-6">
                Order Summary
              </h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="flex-1 input-field py-2.5"
                  />
                  <button className="btn-outline py-2.5 px-4">
                    <Tag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6">
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
                {deliveryFee > 0 && subtotal < 25 && (
                  <p className="text-xs text-muted-foreground">
                    Add £{(25 - subtotal).toFixed(2)} more for free delivery
                  </p>
                )}
                <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>£{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Continue Shopping */}
              <Link
                to="/shop"
                className="block text-center text-sm text-muted-foreground hover:text-foreground mt-4 transition-colors"
              >
                Continue Shopping
              </Link>

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-border space-y-2">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Secure checkout
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Chilled delivery
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Fresh quality guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;

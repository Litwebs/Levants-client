import React from "react";
import { Link } from "react-router-dom";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

const CartDrawer: React.FC = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
    deliveryFee,
    total,
  } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-foreground/50 z-50 animate-fade-in"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card z-50 shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="font-heading text-xl font-semibold">Your Cart</h2>
            <span className="badge-fresh">{itemCount} items</span>
          </div>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading text-lg font-medium mb-2">
                Your cart is empty
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Add some farm-fresh products to get started.
              </p>
              <button onClick={closeCart} className="btn-primary">
                <Link to="/shop">Start Shopping</Link>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const itemKey = item.variant
                  ? `${item.product.id}-${item.variant.id}`
                  : item.product.id;
                const price = item.variant?.price ?? item.product.price;
                const variantName = item.variant?.name;
                const maxStock =
                  typeof (item.variant as any)?.stockQuantity === "number"
                    ? Math.max(0, (item.variant as any).stockQuantity)
                    : undefined;

                return (
                  <div
                    key={itemKey}
                    className="flex gap-4 p-4 bg-secondary/30 rounded-xl"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.product.name}
                      </h4>
                      {variantName && (
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {variantName}
                        </p>
                      )}
                      <p className="text-primary font-semibold text-sm mt-1">
                        £{price.toFixed(2)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 bg-card rounded-lg border border-border">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity - 1,
                                item.variant?.id,
                              )
                            }
                            className="p-1.5 hover:bg-secondary rounded-l-lg transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.quantity + 1,
                                item.variant?.id,
                              )
                            }
                            disabled={
                              typeof maxStock === "number"
                                ? item.quantity >= maxStock
                                : false
                            }
                            className="p-1.5 hover:bg-secondary rounded-r-lg transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            removeItem(item.product.id, item.variant?.id)
                          }
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-6 py-4 space-y-4">
            {/* Free Delivery Notice */}

            {/* Order Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>
                  <span className="text-primary font-medium">FREE</span>
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link
              to="/checkout"
              onClick={closeCart}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Checkout Securely
            </Link>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

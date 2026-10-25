import { Button } from "@/components/ui/button";
import QuantityStepper from "@/components/ui/QuantityStepper";
import React from "react";
import { Link } from "react-router-dom";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import PromotionSummary from "@/components/cart/PromotionSummary";
import AutomaticDealSavings from "./AutomaticDealSavings";

const CartDrawer: React.FC = () => {
  const {
    items,
    deals,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    removeDeal,
    updateDealQuantity,
    itemCount,
    subtotal,
    deliveryFee,
    total,
    promotion,
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
          <Button type="button" variant="ghost" size="quantity"
            onClick={closeCart}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 && deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading text-lg font-medium mb-2">
                Your cart is empty
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                Add some farm-fresh products to get started.
              </p>
              <Button type="button" size="touch" onClick={closeCart}>
                <Link to="/shop">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((entry) => {
                const deal = entry.deal;
                return (
                  <div
                    key={"deal-" + deal.id}
                    className="flex gap-4 p-4 bg-secondary/30 rounded-xl"
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {deal.imageUrl ? (
                        <img
                          src={deal.imageUrl}
                          alt={deal.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="badge-fresh text-[10px]">
                            Package deal
                          </span>
                          <h4 className="truncate text-sm font-medium">
                            {deal.name}
                          </h4>
                        </div>
                        <Button type="button" variant="ghost" size="quantity"
                          onClick={() => removeDeal(deal.id)}
                          className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={"Remove " + deal.name}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {deal.items.length} product{deal.items.length === 1 ? "" : "s"} · save £{deal.savings.toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-primary">
                        £{deal.packagePrice.toFixed(2)}
                      </p>
                      <div className="mt-3"><QuantityStepper quantity={entry.quantity} onQuantityChange={q => updateDealQuantity(deal.id, q)} min={0} max={Math.min(99, deal.maxPackages)} size="sm" label={`Quantity for ${deal.name}`} decreaseLabel="Decrease package quantity" increaseLabel="Increase package quantity" /></div>
                    </div>
                  </div>
                );
              })}

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
                        className="w-full h-full object-contain"
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
                        <QuantityStepper quantity={item.quantity} onQuantityChange={q => updateQuantity(item.product.id, q, item.variant?.id)} min={0} max={typeof maxStock === "number" ? maxStock : 99} size="sm" label={`Quantity for ${item.product.name}`} />

                        <Button type="button" variant="ghost" size="quantity"
                          onClick={() =>
                            removeItem(item.product.id, item.variant?.id)
                          }
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {(items.length > 0 || deals.length > 0) && (
          <div className="border-t border-border px-6 py-4 space-y-4">
            <PromotionSummary />
            {!!promotion?.discountAmount && <p className="text-sm mb-2">Promotion saving: −£{promotion.discountAmount.toFixed(2)}</p>}
            {/* Free Delivery Notice */}

            {/* Order Summary */}
            <AutomaticDealSavings />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-primary font-medium">£0.00 · FREE</span>
                  ) : (
                    `£${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button asChild size="touch" className="w-full"><Link
              to="/checkout"
              onClick={closeCart}
            >
              Checkout Securely
            </Link></Button>

            {/* Continue Shopping */}
            <Button type="button" variant="ghost" size="touch"
              onClick={closeCart}
              className="h-auto w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;

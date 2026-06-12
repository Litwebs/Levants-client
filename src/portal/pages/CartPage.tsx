import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { mockCartItems, type CartItem } from "@/portal/data/mockData";
import { EmptyState, PageHeader } from "@/portal/components/PortalUI";

const CartPage: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(mockCartItems);

  const updateQty = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Your Cart"
        description={`${items.length} item${items.length !== 1 ? "s" : ""}`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-16 w-16" />}
          title="Your cart is empty"
          description="Browse our dairy products and add items to your cart."
          action={
            <Button asChild>
              <Link to="/portal/products">Browse Products</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-2xl p-4 flex gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {item.productName}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.variant}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-medium w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">
                        {item.price}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-20">
              <h3 className="font-semibold text-foreground mb-4">
                Order Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery fee</span>
                  <span>—</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-semibold text-foreground text-base">
                  <span>Total</span>
                  <span>—</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total calculated at checkout
              </p>
              <Button asChild className="w-full mt-4">
                <Link to="/portal/checkout">Proceed to Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/portal/products">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;

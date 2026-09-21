import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Package,
  Truck,
  ArrowRight,
  Loader2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ordersApi } from "@/api/orders";
import { isPortalLoggedIn } from "@/lib/portalAuth";

type ConfirmationState =
  | { status: "confirming" }
  | {
      status: "confirmed";
      orderId: string;
      orderNumber?: string;
      paidWithCredit?: boolean;
    }
  | { status: "error"; message: string };

const PaymentSuccessPage: React.FC = () => {
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    status: "confirming",
  });

  const checkoutSessionId = searchParams.get("session_id");
  const creditOrderId = searchParams.get("order_id");
  const paidWithCredit = searchParams.get("credit") === "1";
  const portalCustomer = isPortalLoggedIn();

  useEffect(() => {
    let active = true;

    const confirm = async () => {
      if (paidWithCredit && creditOrderId) {
        clearCart();
        if (active) {
          setConfirmation({
            status: "confirmed",
            orderId: creditOrderId,
            paidWithCredit: true,
          });
        }
        return;
      }

      if (!checkoutSessionId) {
        if (active) {
          setConfirmation({
            status: "error",
            message:
              "We could not identify this checkout. Please check My Orders before placing another order.",
          });
        }
        return;
      }

      try {
        const response = await ordersApi.confirmCheckout(checkoutSessionId);
        const order = response.data;
        if (!order?.orderId) {
          throw new Error("Order confirmation was incomplete");
        }

        clearCart();
        if (active) {
          setConfirmation({
            status: "confirmed",
            orderId: order.orderId,
            orderNumber: order.orderNumber,
          });
        }
      } catch (error) {
        if (!active) return;
        setConfirmation({
          status: "error",
          message:
            error instanceof Error && error.message
              ? error.message
              : "We could not confirm your payment yet. Please check My Orders before trying again.",
        });
      }
    };

    void confirm();
    return () => {
      active = false;
    };
  }, [checkoutSessionId, clearCart, creditOrderId, paidWithCredit]);

  if (confirmation.status === "confirming") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-20">
          <div className="max-w-xl mx-auto text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <h1 className="font-heading text-3xl font-semibold mb-2">
              Confirming your order
            </h1>
            <p className="text-muted-foreground">
              We're verifying your payment and finalising the order now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (confirmation.status === "error") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-20">
          <div className="max-w-xl mx-auto text-center">
            <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h1 className="font-heading text-3xl font-semibold mb-2">
              We're still confirming your order
            </h1>
            <p className="text-muted-foreground mb-6">
              {confirmation.message}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {portalCustomer ? (
                <Link to="/portal/orders" className="btn-primary">
                  Check My Orders
                </Link>
              ) : null}
              <Link to="/contact" className="btn-outline">
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-muted-foreground">
              Your payment is confirmed and your order is being prepared.
            </p>
            {confirmation.orderNumber ? (
              <p className="mt-2 font-medium">
                Order {confirmation.orderNumber}
              </p>
            ) : null}
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 mb-8 text-left">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Payment Confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    {confirmation.paidWithCredit
                      ? "Your store credit has paid for this order."
                      : "Your payment has been processed successfully."}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Being Prepared
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your items will be carefully packed.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Out for Delivery
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered fresh to your door.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 mb-8">
            <p className="text-sm text-muted-foreground">
              Your order is saved to your account. We also send an email
              confirmation to the email address on the order.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {portalCustomer ? (
              <Link
                to={`/portal/orders/${confirmation.orderId}`}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <ClipboardList className="w-4 h-4" />
                View Order
              </Link>
            ) : null}
            <Link
              to="/shop"
              className={`${portalCustomer ? "btn-outline" : "btn-primary"} inline-flex items-center justify-center gap-2`}
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

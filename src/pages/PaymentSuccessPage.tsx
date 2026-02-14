import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const PaymentSuccessPage: React.FC = () => {
  const { clearCart } = useCart();
  const hasClearedRef = useRef(false);

  useEffect(() => {
    if (!hasClearedRef.current) {
      hasClearedRef.current = true;
      clearCart();
    }
  }, [clearCart]);

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
              Your payment was successful and your order is being prepared.
            </p>
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
                    Your payment has been processed successfully.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Being Prepared</p>
                  <p className="text-sm text-muted-foreground">
                    Your items will be carefully packed in chilled packaging.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Out for Delivery</p>
                  <p className="text-sm text-muted-foreground">
                    Your order will be delivered fresh to your door.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 mb-8">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent with your order details and tracking information.
            </p>
          </div>

          <Link to="/shop" className="btn-primary inline-flex items-center justify-center gap-2">
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

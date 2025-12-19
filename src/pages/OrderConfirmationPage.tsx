import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Package, Truck, ArrowRight } from 'lucide-react';

const OrderConfirmationPage: React.FC = () => {
  const orderNumber = `LD${Date.now().toString().slice(-8)}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
              Thank You for Your Order!
            </h1>
            <p className="text-muted-foreground">
              Your order has been placed successfully.
            </p>
          </div>

          {/* Order Details Card */}
          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 mb-8 text-left">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-heading text-xl font-semibold">{orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">
                  {new Date().toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Order Confirmed</p>
                  <p className="text-sm text-muted-foreground">
                    We've received your order and will begin preparing it shortly.
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

          {/* Email Confirmation */}
          <div className="bg-secondary/50 rounded-xl p-4 mb-8">
            <p className="text-sm text-muted-foreground">
              A confirmation email has been sent to your email address with order details and tracking information.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/shop" className="btn-primary inline-flex items-center justify-center gap-2">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/account" className="btn-outline inline-flex items-center justify-center gap-2">
              Create Account to Track Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;

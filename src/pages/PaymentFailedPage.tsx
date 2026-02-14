import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle, ArrowRight, ShoppingBag } from 'lucide-react';

const PaymentFailedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-2">
              Payment Failed
            </h1>
            <p className="text-muted-foreground">
              Unfortunately your payment could not be processed. Your cart items have been saved.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 mb-8">
            <h3 className="font-heading text-lg font-medium mb-3">What happened?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This can happen if the payment was cancelled, your card was declined, or there was a temporary issue. No charges have been made to your account.
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Check that your card details are correct
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Ensure your card has sufficient funds
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Try a different payment method
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/checkout" className="btn-primary inline-flex items-center justify-center gap-2">
              Try Again
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/cart" className="btn-outline inline-flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Back to Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailedPage;

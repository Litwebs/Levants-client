import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Check, ArrowRight, Repeat, Percent, Truck } from 'lucide-react';

const SubscriptionsPage: React.FC = () => {
  const benefits = [
    {
      icon: Percent,
      title: 'Save 10%',
      description: 'Get 10% off every subscription order, automatically applied at checkout.',
    },
    {
      icon: Calendar,
      title: 'Flexible Schedule',
      description: 'Choose weekly, fortnightly, or monthly deliveries. Change anytime.',
    },
    {
      icon: Repeat,
      title: 'Never Run Out',
      description: 'Your favourite products delivered on schedule, so you never run low.',
    },
    {
      icon: Truck,
      title: 'Free Delivery',
      description: 'All subscriptions include free delivery, regardless of order value.',
    },
  ];

  const popularSubscriptions = [
    {
      name: 'Milk Essentials',
      description: '2× Farm Fresh Milk (2L) + 1× Fresh Double Cream',
      price: 12.99,
      frequency: 'Weekly',
    },
    {
      name: 'Cheese Lover',
      description: '1× Mature Cheddar (400g) + 1× Red Leicester (400g)',
      price: 23.48,
      frequency: 'Fortnightly',
    },
    {
      name: 'Family Bundle',
      description: '4× Farm Fresh Milk (2L) + 2× Butter + 1× Cheddar',
      price: 34.99,
      frequency: 'Weekly',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16 lg:py-24">
        <div className="container-custom">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 bg-gold/20 text-gold-light rounded-full text-sm font-medium mb-6">
              Save 10% on every order
            </span>
            <h1 className="font-heading text-4xl lg:text-5xl font-semibold mb-6">
              Subscribe & Save
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Never run out of your farm-fresh favourites. Set up a subscription and enjoy automatic deliveries at a discounted price.
            </p>
            <Link to="/shop" className="btn-gold inline-flex items-center gap-2">
              Build Your Subscription
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Why Subscribe?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of happy subscribers enjoying convenient, affordable dairy delivery.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="bg-card p-6 rounded-2xl border border-border text-center opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              How It Works
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {[
                {
                  step: 1,
                  title: 'Choose Your Products',
                  description: 'Select the products you want to receive regularly and add them to your subscription.',
                },
                {
                  step: 2,
                  title: 'Set Your Schedule',
                  description: 'Choose how often you want delivery—weekly, fortnightly, or monthly.',
                },
                {
                  step: 3,
                  title: 'Sit Back & Enjoy',
                  description: 'Your order arrives automatically on schedule. Skip, pause, or cancel anytime.',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Subscriptions */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Popular Subscription Bundles
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start with one of our pre-built bundles, or create your own custom subscription.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {popularSubscriptions.map((sub, index) => (
              <div
                key={sub.name}
                className="bg-card p-6 rounded-2xl border border-border opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="badge-fresh">{sub.frequency}</span>
                  <span className="badge-gold">Save 10%</span>
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">{sub.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{sub.description}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-semibold text-primary">
                    £{(sub.price * 0.9).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    £{sub.price.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {sub.frequency.toLowerCase()}</span>
                </div>
                <button className="btn-outline w-full">
                  Subscribe Now
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Build Custom Subscription
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-4">
              Questions About Subscriptions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Find answers to common questions about our subscription service in our FAQ.
            </p>
            <Link to="/delivery#faqs" className="btn-outline inline-flex items-center gap-2">
              View FAQs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SubscriptionsPage;

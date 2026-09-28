import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CreditCard,
  HelpCircle,
  PackagePlus,
  PauseCircle,
  RefreshCcw,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    title: "Create your subscription",
    description:
      "Choose the products you want delivered regularly and complete the setup from My Subscriptions.",
    icon: ShoppingBag,
  },
  {
    title: "Choose your delivery plan",
    description:
      "Select the available delivery day and frequency that works for your household.",
    icon: CalendarDays,
  },
  {
    title: "Manage future deliveries",
    description:
      "Update recurring products, add extras to the next delivery, or review upcoming delivery information.",
    icon: RefreshCcw,
  },
  {
    title: "Stay in control",
    description:
      "Use the portal to review payments, store credit, notifications, and subscription status at any time.",
    icon: CreditCard,
  },
];

const guideSections = [
  {
    title: "Changing products in your subscription",
    icon: RefreshCcw,
    body: [
      "Open My Subscriptions and choose the subscription you want to manage.",
      "Use the subscription controls to add, update, or remove recurring products.",
      "Recurring changes apply to the subscription plan and therefore affect future deliveries once the change becomes effective.",
      "The portal will show pending changes where a delivery cut-off means an update cannot apply immediately.",
    ],
  },
  {
    title: "Adding a one-off extra to your next delivery",
    icon: PackagePlus,
    body: [
      "Open the subscription you want to add an extra item to.",
      "Choose the option to add products to the next delivery.",
      "Select the product and quantity you want.",
      "The extra is attached to that upcoming delivery only; it does not permanently change your normal recurring items.",
    ],
  },
  {
    title: "Delivery schedule and cut-off rules",
    icon: CalendarDays,
    body: [
      "Your subscription page shows the next scheduled delivery date and the delivery plan attached to the subscription.",
      "Changes close to a scheduled delivery may be subject to the configured cut-off rules.",
      "When a change cannot apply to the immediate delivery, the portal will show the pending state so you know when it will take effect.",
    ],
  },
  {
    title: "Pausing, resuming, or cancelling",
    icon: PauseCircle,
    body: [
      "Use the subscription management page when you need to pause a recurring plan.",
      "Paused subscriptions can be resumed from the portal.",
      "Cancellation controls are also available from the subscription page. Review the effective date shown before confirming a cancellation.",
    ],
  },
  {
    title: "Payments",
    icon: CreditCard,
    body: [
      "The Payments page shows payment records associated with your account.",
      "If a payment needs attention, the portal will highlight it on the dashboard and in the Payments area.",
      "Use the payment information shown in the portal to resolve any action required before the next charge or delivery.",
    ],
  },
  {
    title: "Store credit",
    icon: Wallet,
    body: [
      "Your Store Credit page shows your current available balance and credit history.",
      "Available credit can be used where the checkout or order flow offers store credit as a payment option.",
      "Credit transactions remain visible in the portal so you can see when credit was added or used.",
    ],
  },
  {
    title: "Notifications and account support",
    icon: Bell,
    body: [
      "Keep your contact details up to date so important order, payment, and subscription messages reach you.",
      "If something cannot be completed through the self-service controls, use the Support area in the customer portal to contact the team.",
    ],
  },
];

const faqs = [
  {
    question: "Will changing my subscription products affect future deliveries?",
    answer:
      "Yes. Changes to the recurring items on a subscription update the plan for future deliveries once the change becomes effective.",
  },
  {
    question: "How do I add something for one delivery only?",
    answer:
      "Open the subscription and use the next-delivery add-on option. This adds the selected item to the upcoming delivery without permanently changing the subscription.",
  },
  {
    question: "What happens if I pause my subscription?",
    answer:
      "The subscription is placed on hold until it is resumed. Check the subscription page for its current status and next-delivery information before making changes.",
  },
  {
    question: "Where can I see my store credit?",
    answer:
      "Open Store Credit from the portal menu to see your available balance and transaction history.",
  },
];

const SubscriptionGuidePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-forest/15 bg-gradient-to-br from-forest/10 via-background to-background p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest mb-4">
              <BookOpen className="h-3.5 w-3.5" />
              Customer subscription guide
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              How subscriptions work
            </h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
              A practical guide to setting up and managing your recurring
              Levants Dairy deliveries from the customer portal.
            </p>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/portal/subscriptions">
              Manage subscriptions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Getting started
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            The subscription journey in four simple steps.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Step {index + 1}
                      </p>
                      <h3 className="mt-1 font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Managing your subscription
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            What each part of the portal is for and when to use it.
          </p>
        </div>

        <div className="grid gap-3">
          {guideSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                    </span>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {section.body.map((item, index) => (
                      <li
                        key={item}
                        className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-0.5 h-5 w-5 rounded-full bg-muted text-foreground text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Common questions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Quick answers to the things customers ask most often.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-forest flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {faq.question}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-forest/20 bg-forest/5">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">
              Still need help?
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Contact the team through the customer portal if you cannot find
              the answer you need.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/portal/support">
              Go to support
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionGuidePage;

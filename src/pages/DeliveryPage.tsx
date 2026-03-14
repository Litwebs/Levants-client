import React, { useState } from "react";
import {
  Truck,
  Snowflake,
  Clock,
  MapPin,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { checkDeliveryPostcode } from "@/api/delivery";

const DeliveryPage: React.FC = () => {
  const [postcode, setPostcode] = useState("");
  const [checking, setChecking] = useState(false);
  const [postcodeResult, setPostcodeResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleCheckPostcode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostcodeResult(null);
    if (!postcode.trim()) {
      setPostcodeResult({
        type: "error",
        message: "Please enter your postcode.",
      });
      return;
    }

    setChecking(true);
    try {
      const res = await checkDeliveryPostcode(postcode);
      if (res.deliverable) {
        setPostcodeResult({
          type: "success",
          message: res.message || "Great news — we deliver to your area.",
        });
      } else {
        setPostcodeResult({
          type: "error",
          message:
            res.message ||
            "Sorry — we don’t currently deliver to this postcode.",
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to check postcode. Please try again.";
      setPostcodeResult({ type: "error", message });
    } finally {
      setChecking(false);
    }
  };

  const deliveryFeatures = [
    {
      icon: Truck,
      title: "Sunday & Wednesday Delivery",
      description:
        "We deliver every Sunday and Wednesday, straight from local Yorkshire family-run farms.",
    },
    {
      icon: Clock,
      title: "Order Deadlines",
      description:
        "Order by Friday at 10pm for Sunday delivery, or by Monday at 10pm for Wednesday delivery.",
    },
    {
      icon: Package,
      title: "Delivery Window",
      description:
        "Deliveries arrive between 9am and 6pm. You'll receive an email when your order is out for delivery and a follow-up confirmation.",
    },
    {
      icon: Snowflake,
      title: "Refrigerated Vans",
      description:
        "Our temperature-controlled refrigerated vans help ensure your order arrives in optimal condition.",
    },
  ];

  const faqs = [
    {
      question: "What areas do you deliver to?",
      answer:
        "We currently deliver to Bradford and surrounding areas. Enter your postcode to confirm we deliver to your area.",
    },
    {
      question: "Are your cows grass fed?",
      answer: "Yes — our cows are grass fed, free range, and pasture raised.",
    },
    {
      question: "Are your eggs free range?",
      answer:
        "Yes — our hens roam freely both indoors and outdoors under natural conditions.",
    },
    {
      question: "Do you use Bovaer?",
      answer: "No, we do not use the Bovaer feed additive.",
    },
    {
      question: "Do you use any hormones?",
      answer:
        "No — we do not use any hormones, or any chemicals, additives, or preservatives.",
    },
    {
      question: "What times do you deliver?",
      answer:
        "We deliver between 9am and 6pm. You will receive an email when your order is out on delivery and a follow up email with confirmation of delivery.",
    },
    {
      question: "Can I leave delivery instructions?",
      answer:
        'Absolutely! You can add delivery instructions at checkout. Whether it\'s "leave at side gate" or "ring doorbell twice", we\'ll follow your preferences.',
    },
    {
      question: "How long do products stay fresh?",
      answer: "All products come with clearly marked use-by dates.",
    },
    {
      question: "Can I cancel my order?",
      answer:
        "If you wish to cancel your order, please do so before the order deadline (Friday 10pm for Sunday deliveries and Monday 10pm for Wednesday deliveries).",
    },
    {
      question: "Do you offer subscriptions?",
      answer:
        "Our weekly subscription is super easy! Just WhatsApp us your order for delivery every Wednesday, Sunday, or both. Any changes are simple — tell us by Friday at 10pm for Sunday's delivery, or by Monday at 10pm for Wednesday's. It's contract free!",
    },
    {
      question: "What if I’m not at home?",
      answer:
        "If you're not home at the time of delivery, we'll ensure your order is left in a secure location. To give you peace of mind, we'll also send you an email with a photo confirming its placement.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="container-custom">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl lg:text-4xl font-semibold mb-4">
              Delivery & FAQs
            </h1>
            <p className="text-primary-foreground/80">
              Everything you need to know about our delivery schedule, weekly
              subscriptions, and FAQs.
            </p>
          </div>
        </div>
      </section>

      {/* Delivery Features */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-8 text-center">
            How Delivery Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {deliveryFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card p-6 rounded-2xl border border-border text-center opacity-0 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Delivery Area */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-4">
              Check Your Delivery Area
            </h2>
            <p className="text-muted-foreground mb-8">
              Enter your postcode to see if we deliver to your area.
            </p>
            <form
              onSubmit={handleCheckPostcode}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="text"
                placeholder="Enter your postcode"
                className="flex-1 input-field"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                disabled={checking}
              />
              <button className="btn-primary" type="submit" disabled={checking}>
                {checking ? "Checking..." : "Check"}
              </button>
            </form>

            {postcodeResult && (
              <div
                className={
                  postcodeResult.type === "success"
                    ? "mt-4 text-lg font-semibold text-primary"
                    : "mt-4 text-lg font-semibold text-destructive"
                }
                role="status"
                aria-live="polite"
              >
                {postcodeResult.message}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4">
              We currently deliver to Bradford and surrounding areas.
            </p>
          </div>
        </div>
      </section>

      {/* Weekly Subscription */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <RefreshCw className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-4">
                  Weekly Subscription
                </h2>
                <p className="text-muted-foreground">
                  Want a regular delivery? Our weekly subscription is super
                  easy! Just WhatsApp us your order for delivery every
                  Wednesday, Sunday, or both.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 space-y-4">
              <p className="text-sm text-muted-foreground">
                Any changes to your order are simple — tell us by Friday at 10pm
                for Sunday's delivery, or by Monday at 10pm for Wednesday's.
              </p>
              <p className="text-sm text-muted-foreground">
                It’s contract free!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 lg:py-24 bg-secondary/30">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-8 text-center">
              Why Choose Us
            </h2>
            <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 space-y-3">
              <p className="text-sm text-muted-foreground">
                Unbeatable Freshness: We deliver milk that's milked, bottled,
                and to your door within 12 hours. Taste the difference freshness
                makes!
              </p>
              <p className="text-sm text-muted-foreground">
                Convenient Delivery: Get fresh milk delivered twice a week,
                right to your doorstep.
              </p>
              <p className="text-sm text-muted-foreground">
                Reputable & Trusted: We're a company known for our reliability
                and commitment to customer satisfaction.
              </p>
              <p className="text-sm text-muted-foreground">
                100% Natural: Enjoy pure, wholesome milk, free from artificial
                additives.
              </p>
              <p className="text-sm text-muted-foreground">
                Supporting Local Farmers: By choosing us, you're directly
                supporting local farmers and sustainable agriculture.
              </p>
              <p className="text-sm text-muted-foreground">
                Affordable: Get the best quality and freshness at a price that's
                friendly to your wallet.
              </p>
              <p className="text-sm text-muted-foreground">
                Quality & Efficiency: From our farm to your fridge, we
                prioritize quality and ensure a seamless delivery experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Returns Policy */}
      <section className="py-16 lg:py-24" id="returns">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-start gap-4 mb-8">
              <RefreshCw className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-4">
                  Policy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Due to the perishable nature of our dairy products we do not
                  accept returns. Refunds are only issued in cases where items
                  arrive damaged, spoiled, or incorrect, and must be reported to
                  us within 24 hours of delivery.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="font-medium mb-2">Refunds</h3>
                <p className="text-sm text-muted-foreground">
                  If items arrive damaged, spoiled, or incorrect, please report
                  it to us within 24 hours of delivery so we can help.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Cancellations</h3>
                <p className="text-sm text-muted-foreground">
                  If you wish to cancel your order, please do so before the
                  order deadline (Friday 10pm for Sunday deliveries and Monday
                  10pm for Wednesday deliveries).
                </p>
              </div>
              <div className="bg-accent/10 rounded-xl p-4">
                <p className="text-sm">
                  <strong>Note:</strong> Due to the perishable nature of our
                  products, we cannot accept returns of goods once delivered. We
                  pride ourselves on delivering milk the very same day it's
                  milked, ensuring ultimate freshness. Our
                  temperature-controlled refrigerated vans help ensure your
                  order arrives in optimal condition. While we take every
                  precaution to maintain freshness from our farm to your
                  doorstep, once the delivery is made, factors beyond our
                  control can influence the milk's shelf life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 lg:py-24 bg-secondary/30" id="faqs">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-8 text-center">
              Frequently Asked Questions
            </h2>

            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="bg-card rounded-xl border border-border px-6"
                >
                  <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 lg:py-24">
        <div className="container-custom">
          <div className="bg-card rounded-3xl border border-border p-8 lg:p-12 text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl lg:text-3xl font-semibold mb-4">
              Still Have Questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Can't find the answer you're looking for? Our friendly team is
              here to help.
            </p>
            <a
              href="/contact"
              className="btn-primary inline-flex items-center gap-2"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DeliveryPage;

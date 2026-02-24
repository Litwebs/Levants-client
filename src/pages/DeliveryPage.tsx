import React, { useState } from "react";
import {
  Truck,
  Snowflake,
  Clock,
  MapPin,
  Package,
  RefreshCw,
  ChevronDown,
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
      title: "Local Delivery",
      description:
        "We deliver to selected postcodes within our local area, ensuring freshness and reducing food miles.",
    },
    {
      icon: Snowflake,
      title: "Chilled Packaging",
      description:
        "All orders are packed in insulated, recyclable packaging with ice packs to keep products fresh.",
    },
    {
      icon: Clock,
      title: "Next-Day Delivery",
      description:
        "Order before 2pm for next-day delivery. Select your preferred time slot at checkout.",
    },
    {
      icon: Package,
      title: "Free Over £25",
      description:
        "Enjoy free delivery on all orders over £25. Otherwise, a £3.99 delivery fee applies.",
    },
  ];

  const faqs = [
    {
      question: "What areas do you deliver to?",
      answer:
        "We currently deliver to postcodes within a 30-mile radius of our farm, including Cambridge, Oxford, Norwich, and surrounding areas. Enter your postcode at checkout to confirm availability.",
    },
    {
      question: "How is my order kept fresh during delivery?",
      answer:
        "All orders are packed in insulated, recyclable boxes with food-grade ice packs. This keeps products chilled for up to 48 hours, ensuring they arrive fresh and safe to consume.",
    },
    {
      question: "Can I choose a delivery time slot?",
      answer:
        "Yes! At checkout, you can select from available delivery dates and choose between morning (8am-12pm), afternoon (12pm-4pm), or evening (4pm-8pm) slots.",
    },
    {
      question: "What if I'm not home when my order arrives?",
      answer:
        "You can add delivery instructions at checkout for a safe place to leave your order. Our packaging keeps products chilled, so they'll be fine for a few hours.",
    },
    {
      question: "Can I change or cancel my order?",
      answer:
        "Orders can be modified or cancelled up to 24 hours before your scheduled delivery. Contact us by phone or email, and we'll be happy to help.",
    },
    {
      question: "Do you offer subscriptions?",
      answer:
        "Yes! Our subscription service lets you schedule regular deliveries of your favourite products at a frequency that suits you—weekly, fortnightly, or monthly. You'll also save 10% on subscription orders.",
    },
    {
      question: "What is your returns policy?",
      answer:
        "Due to the perishable nature of our products, we cannot accept returns. However, if you receive a damaged or unsatisfactory product, please contact us within 24 hours with photos, and we'll arrange a replacement or refund.",
    },
    {
      question: "How do I track my order?",
      answer:
        "Once your order is dispatched, you'll receive an email with tracking information. On delivery day, you'll get real-time updates about your driver's estimated arrival time.",
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
              Everything you need to know about getting farm-fresh dairy
              delivered to your door.
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
              We currently deliver to Bradford, Leeds, Wakefield, and
              surrounding areas.
            </p>
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
                  Returns & Refunds
                </h2>
                <p className="text-muted-foreground mb-4">
                  We take great care in preparing and delivering your order.
                  However, if something isn't right, we're here to help.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 space-y-6">
              <div>
                <h3 className="font-medium mb-2">
                  Damaged or Defective Products
                </h3>
                <p className="text-sm text-muted-foreground">
                  If your products arrive damaged or are not of satisfactory
                  quality, please contact us within 24 hours of delivery.
                  Include photos of the product and packaging, and we'll arrange
                  a replacement or full refund.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Missing Items</h3>
                <p className="text-sm text-muted-foreground">
                  If any items are missing from your order, contact us within 24
                  hours. We'll either include them in your next delivery or
                  issue a refund.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Cancellations</h3>
                <p className="text-sm text-muted-foreground">
                  Orders can be cancelled up to 24 hours before your scheduled
                  delivery for a full refund. Cancellations made less than 24
                  hours before delivery may incur a 50% charge.
                </p>
              </div>
              <div className="bg-accent/10 rounded-xl p-4">
                <p className="text-sm">
                  <strong>Note:</strong> Due to the perishable nature of our
                  products, we cannot accept returns of goods once delivered.
                  Your statutory rights are not affected.
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

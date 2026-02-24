import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { checkDeliveryPostcode } from "@/api/delivery";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [postcode, setPostcode] = useState("");
  const [checkingPostcode, setCheckingPostcode] = useState(false);
  const [postcodeResult, setPostcodeResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const footerLinks = {
    shop: [
      { name: "All Products", path: "/shop" },
      { name: "Milk", path: "/shop?category=milk" },
      { name: "Cheese", path: "/shop?category=cheese" },
      { name: "Butter & Cream", path: "/shop?category=cream" },
      { name: "Honey", path: "/shop?category=honey" },
    ],
    company: [
      { name: "About Us", path: "/about" },
      { name: "Our Farm", path: "/about#farm" },
      { name: "Sustainability", path: "/about#sustainability" },
      { name: "Careers", path: "/careers" },
    ],
    support: [
      { name: "Delivery Information", path: "/delivery" },
      { name: "FAQs", path: "/delivery#faqs" },
      { name: "Contact Us", path: "/contact" },
      { name: "Returns Policy", path: "/delivery#returns" },
    ],
    legal: [
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
      { name: "Cookie Policy", path: "/cookies" },
    ],
  };

  return (
    <footer className="bg-primary text-primary-foreground overflow-x-hidden">
      {/* Main Footer Links */}
      <div className="container-custom py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0 min-w-0">
            <Link to="/" className="inline-block mb-4">
              <h2 className="font-heading text-2xl font-semibold">
                Levants Dairy
              </h2>
            </Link>
            <p className="text-primary-foreground/80 text-sm mb-6 max-w-xs">
              Fresh farm food delivered to your door. Quality dairy products
              from local farms.
            </p>

            <div className="mb-6 max-w-xs">
              <h4 className="font-medium text-sm uppercase tracking-wider mb-3">
                Check Delivery Area
              </h4>
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPostcodeResult(null);
                  if (!postcode.trim()) {
                    setPostcodeResult({
                      type: "error",
                      message: "Please enter your postcode.",
                    });
                    return;
                  }

                  setCheckingPostcode(true);
                  try {
                    const res = await checkDeliveryPostcode(postcode);
                    if (res.deliverable) {
                      setPostcodeResult({
                        type: "success",
                        message:
                          res.message ||
                          "Great news — we deliver to your area.",
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
                    setCheckingPostcode(false);
                  }
                }}
              >
                <input
                  type="text"
                  placeholder="Postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  disabled={checkingPostcode}
                  className="min-w-0 w-full flex-1 px-4 py-3 rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={checkingPostcode}
                  className="w-full sm:w-auto shrink-0 px-4 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-gold-dark transition-colors"
                >
                  {checkingPostcode ? "Checking…" : "Check"}
                </button>
              </form>

              {postcodeResult && (
                <div
                  className={
                    postcodeResult.type === "success"
                      ? "mt-3 text-base font-semibold text-primary-foreground"
                      : "mt-3 text-base font-semibold text-primary-foreground"
                  }
                  role="status"
                  aria-live="polite"
                >
                  <span className="break-words">{postcodeResult.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@levantsdairy.com"
                className="p-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Shop
            </h4>
            <ul className="space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-medium text-sm uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-primary-foreground text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/20">
        <div className="container-custom py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © {currentYear} Levants Dairy. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <img
                src="/placeholder.svg"
                alt="Visa"
                className="h-6 opacity-70"
              />
              <img
                src="/placeholder.svg"
                alt="Mastercard"
                className="h-6 opacity-70"
              />
              <img
                src="/placeholder.svg"
                alt="Apple Pay"
                className="h-6 opacity-70"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

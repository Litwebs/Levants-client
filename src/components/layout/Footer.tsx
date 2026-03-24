import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, MessageCircle, Music2, Mail } from "lucide-react";
import img from "@/assets/mark.jpeg";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

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
    <footer className="bg-border text-foreground overflow-x-hidden">
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
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Farm fresh delivered to your door
            </p>

            <div className="mb-6 max-w-xs">
              <img
                src={img}
                alt="Red Tractor Certified Standards — Traceable, safe & farmed with care"
                className="h-14 w-auto opacity-90 object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              <a
                href="#"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="TikTok"
              >
                <Music2 className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@levantsdairy.com"
                className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/15 transition-colors"
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
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
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
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
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
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
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
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
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
      <div className="border-t border-foreground/10">
        <div className="container-custom py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              © {currentYear} Levants Dairy. All rights reserved.
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-end">
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
